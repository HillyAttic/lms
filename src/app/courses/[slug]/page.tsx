import { notFound } from "next/navigation";
import { cache } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/breadcrumb";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import { StarDisplay } from "@/components/ui/starDisplay";
import { BookOpen, Star } from "@/lib/icons";
import {
  getPublicCourseBySlug,
  type PublicCourse,
} from "@/app/actions/public-course-actions";
import { getLaunchableItemById } from "@/app/actions/repository-actions";
import { siteName } from "@/utils/envExport";
import { categoryData } from "@/components/categories/categoryData";

const categoryLabels = Object.fromEntries(
  categoryData.map((category) => [category.slug.current, category.title]),
);

/**
 * Metadata and the page body both need this course. React dedupes within one
 * render pass, so the second call is free — see the metadata guide's
 * "Memoizing data requests".
 */
const getCourse = cache((slug: string) => getPublicCourseBySlug(slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCourse(slug);
  const course = result.success ? (result.data as PublicCourse | undefined) : null;

  return {
    title: course?.title ? `${course.title} | ${siteName}` : `Course Detail | ${siteName}`,
    description: course?.shortDescription || undefined,
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCourse(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const course = result.data as PublicCourse;

  // A course with no linked repository item has nothing to launch yet, so the
  // enrol button stays inert rather than leading to an empty player.
  const contentResult = course.contentId
    ? await getLaunchableItemById(course.contentId)
    : null;
  const content = contentResult?.success ? contentResult.data : null;

  const category = course.category || "";
  const rating = course.rating || 0;
  const price = course.discountPrice || course.price || 0;

  return (
    <main className="bg-gray-50 pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pb-28">
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: "Course Detail" },
            { label: course.title },
          ]}
        />

        <div className="mt-8 flex flex-col items-start gap-x-16 gap-y-10 lg:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full shrink-0 lg:w-[46%]">
            {course.thumbnailUrl ? (
              // Thumbnails are signed URLs from storage, which next/image is not
              // configured for.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="aspect-760/430 w-full rounded-[2rem] object-cover"
              />
            ) : (
              <div className="grid aspect-760/430 w-full place-items-center rounded-[2rem] bg-white text-gray-300">
                <Star className="size-12" />
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="w-full lg:flex-1">
            <h1 className="font-mulish text-[clamp(1.75rem,1.4rem+1.4vw,2.75rem)] leading-tight font-bold">
              {course.title}
            </h1>

            {course.instructor?.name && (
              <p className="mt-3 text-lg text-secondary">
                By{" "}
                <span className="font-semibold text-foreground">
                  {course.instructor.name}
                </span>
              </p>
            )}

            {category && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3.5 py-1.5 text-sm font-semibold text-purple-700">
                <BookOpen className="size-4 stroke-[0.75]" />
                {categoryLabels[category] || category}
              </span>
            )}

            {course.shortDescription && (
              <p className="mt-6 text-[clamp(1rem,0.92rem+0.35vw,1.375rem)] leading-relaxed text-secondary">
                {course.shortDescription}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <StarDisplay value={rating} />
              <span className="text-sm text-gray-500">
                {/* Courses carry no review count, so learners stand in as the
                    activity figure the mock shows after the rating. */}
                {rating.toFixed(1)} ({course.totalLearners || 0})
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-bold tracking-wide text-emerald-500 uppercase">
                {price > 0 ? `$${price.toFixed(2)}` : "Free"}
              </span>
            </div>

            <div className="mt-8">
              {content ? (
                <Button asChild size="lg" className="rounded-full px-8 py-1.5">
                  <Link href={`/courses/${course.slug}/launch`}>
                    <span className="text-base font-semibold">Enroll Now</span>
                    <ButtonArrow />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" disabled className="rounded-full px-8 py-1.5">
                  <span className="text-base font-semibold">
                    Content coming soon
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
