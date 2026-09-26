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

  /* Narrow facts, read off the real record. Everything listed here is present
     on the doc — nothing is invented to fill the panel out. */
  const facts = [
    { label: "Format", value: typeLabels[category as RepositoryContentType] || category },
    duration ? { label: "Duration", value: calculateMinutes(duration) } : null,
    content?.scormVersion
      ? { label: "SCORM", value: content.scormVersion }
      : null,
    content?.interactivityLevel
      ? { label: "Level", value: String(content.interactivityLevel) }
      : null,
    { label: "Instructor", value: instructor },
    { label: "Price", value: price > 0 ? `$${price.toFixed(2)}` : "Free" },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="bg-background pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pb-28">
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Courses", href: "/courses" },
            { label: title },
          ]}
        />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Thumbnail */}
          <div className="lg:col-span-7">
            {thumbnail ? (
              // Thumbnails are signed URLs from storage, which next/image is not
              // configured for.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt={title}
                className="aspect-760/430 w-full rounded-[24px] border-[1.5px] border-ink object-cover"
              />
            ) : (
              <div className="grid aspect-760/430 w-full place-items-center rounded-[24px] border-[1.5px] border-ink bg-white text-gray-300">
                <Star className="size-12" />
              </div>
            )}

            {description && (
              <div className="mt-10">
                <h2 className="display-3">About this course</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary text-pretty">
                  {description}
                </p>
              </div>
            )}

            <CourseReviews reviews={reviews} />
          </div>

          {/* Sidebar: the facts that decide the click. Sticky on desktop so the
              Enrol action stays reachable past a long description. */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            {category && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[0.6875rem] font-bold tracking-[0.08em] text-ink uppercase">
                {TypeIcon ? (
                  <TypeIcon className="size-4" />
                ) : (
                  <BookOpen className="size-4" />
                )}
                {typeLabels[category as RepositoryContentType] ||
                  categoryLabels[category] ||
                  category}
              </span>
            )}

            <h1 className="display-2 mt-5 text-balance">{title}</h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <StarRating slug={slug} rating={rating} count={ratingCount} />
              {duration ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-secondary">
                  <Clock className="size-4" />
                  {calculateMinutes(duration)}
                </span>
              ) : null}
            </div>

            <dl className="mt-8 border-t-[1.5px] border-ink">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-4 border-b-[1.5px] border-ink/15 py-3.5"
                >
                  <dt className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">
                    {fact.label}
                  </dt>
                  <dd className="text-right font-semibold">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <CourseActions slug={slug} launchable={!!content} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
