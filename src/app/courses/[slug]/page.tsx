import { notFound } from "next/navigation";
import { cache } from "react";
import Breadcrumb from "@/components/breadcrumb";
import { StarRating } from "@/components/ui/starRating";
import CourseActions from "./courseActions";
import { BookOpen, Clock, FileStack, GamepadIcon, Star, Video } from "@/lib/icons";
import { CourseReviews } from "@/components/courses/courseReviews";
import {
  getCourseReviews,
  getPublicCourseBySlug,
  type PublicCourse,
} from "@/app/actions/public-course-actions";
import {
  getLaunchableItemById,
  type RepositoryContentItem,
  type RepositoryContentType,
} from "@/app/actions/repository-actions";
import { calculateMinutes } from "@/lib/utils";
import { siteName } from "@/utils/envExport";
import { categoryData } from "@/components/categories/categoryData";

const categoryLabels = Object.fromEntries(
  categoryData.map((category) => [category.slug.current, category.title]),
);

const typeLabels: Record<RepositoryContentType, string> = {
  scorm: "SCORM",
  video: "Video",
  game: "Game",
};

const typeIcons: Record<RepositoryContentType, typeof FileStack> = {
  scorm: FileStack,
  video: Video,
  game: GamepadIcon,
};

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
  const publicCourse = result.success
    ? (result.data as PublicCourse | undefined)
    : undefined;

  // Two things can live at this URL: a `public_courses` record, or — when the
  // admin panel hasn't created one — the repository upload itself. The second
  // branch is why a freshly uploaded SCORM package is browsable immediately.
  const linkedContent = publicCourse?.contentId
    ? await getLaunchableItemById(publicCourse.contentId)
    : null;
  let content = linkedContent?.success
    ? (linkedContent.data as RepositoryContentItem)
    : undefined;

  if (!content) {
    const fallback = await getLaunchableItemById(slug);
    content = fallback.success
      ? (fallback.data as RepositoryContentItem)
      : undefined;
  }

  if (!publicCourse && !content) {
    notFound();
  }

  const reviewsResult = await getCourseReviews(slug);
  const reviews = reviewsResult.success ? reviewsResult.data : [];

  const title = publicCourse?.title || content?.name || "Untitled course";
  const description =
    publicCourse?.shortDescription || content?.description || "";
  const thumbnail = publicCourse?.thumbnailUrl || content?.thumbnailUrl || null;
  const duration = content?.duration || 0;
  const category = publicCourse?.category || content?.type || "";
  const rating = publicCourse?.rating || content?.rating || 0;
  const ratingCount = publicCourse?.ratingCount || content?.ratingCount || 0;
  const price = publicCourse?.discountPrice || publicCourse?.price || 0;
  const instructor = publicCourse?.instructor?.name || siteName;
  const TypeIcon = content ? typeIcons[content.type] : null;

  return (
    <main className="bg-gray-50 pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pb-28">
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: title },
          ]}
        />

        <div className="mt-8 flex flex-col items-start gap-x-16 gap-y-10 lg:flex-row">
          {/* Thumbnail */}
          <div className="relative w-full shrink-0 lg:w-[46%]">
            {thumbnail ? (
              // Thumbnails are signed URLs from storage, which next/image is not
              // configured for.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt={title}
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
              {title}
            </h1>

            <p className="mt-3 text-lg text-secondary">
              By{" "}
              <span className="font-semibold text-foreground">{instructor}</span>
            </p>

            {category && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3.5 py-1.5 text-sm font-semibold text-purple-700">
                {TypeIcon ? (
                  <TypeIcon className="size-4 stroke-[0.75]" />
                ) : (
                  <BookOpen className="size-4 stroke-[0.75]" />
                )}
                {typeLabels[category as RepositoryContentType] ||
                  categoryLabels[category] ||
                  category}
              </span>
            )}

            {description && (
              <p className="mt-6 text-[clamp(1rem,0.92rem+0.35vw,1.375rem)] leading-relaxed text-secondary">
                {description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <StarRating
                slug={slug}
                rating={rating}
                count={ratingCount}
              />
              {duration ? (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="size-4" />
                  {calculateMinutes(duration)}
                </span>
              ) : null}
              <span className="text-gray-300">|</span>
              <span className="text-sm font-bold tracking-wide text-emerald-500 uppercase">
                {price > 0 ? `$${price.toFixed(2)}` : "Free"}
              </span>
            </div>

            <div className="mt-8">
              <CourseActions slug={slug} launchable={!!content} />
            </div>
          </div>
        </div>

        <CourseReviews reviews={reviews} />
      </div>
    </main>
  );
}
