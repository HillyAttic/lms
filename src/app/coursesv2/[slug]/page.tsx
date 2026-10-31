import { notFound } from "next/navigation";
import { cache } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/avatar";
import Reveal from "@/components/ui/reveal";
import { StarDisplay } from "@/components/ui/starDisplay";
import { StarRating } from "@/components/ui/starRating";
import { BookOpen, Clock, FileStack, GamepadIcon, Star, Video } from "@/lib/icons";
import { calculateMinutes, formatDate } from "@/lib/utils";
import { siteName } from "@/utils/envExport";
import { categoryData } from "@/components/categories/categoryData";
import { LandingFooter, LandingHeader } from "@/components/landing";
import {
  getCourseReviews,
  getPublicCourseBySlug,
  type CourseReview,
  type PublicCourse,
} from "@/app/actions/public-course-actions";
import {
  getLaunchableItemById,
  type RepositoryContentItem,
  type RepositoryContentType,
} from "@/app/actions/repository-actions";
import CourseActions from "./courseActions";

/*
 * /coursesv2/[slug] — the Motion theme's read of the course detail page.
 * Same data and same enrolment behaviour as /courses/[slug]; only the visual
 * language differs so both can be compared side by side.
 */

const GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";

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

export default async function CourseDetailV2Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCourse(slug);
  const publicCourse = result.success
    ? (result.data as PublicCourse | undefined)
    : undefined;

  // A slug can name a `public_courses` record or the repository upload itself —
  // same fallback as /courses/[slug].
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
  const reviews: CourseReview[] = reviewsResult.success ? reviewsResult.data : [];

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

  /* Narrow facts, read off the real record — nothing invented to fill it out. */
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
    <div
      className="theme-v2 theme-v2-page theme-v2-static min-h-dvh overflow-hidden bg-scroll text-[#334155] lg:bg-fixed"
    >
      <LandingHeader active="courses" accent="#4338ca" />

      <main className="relative mx-auto max-w-[1200px] px-6 py-12 lg:px-8 lg:py-14">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-56 w-56 animate-float rounded-full bg-[#2563eb]/15 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 animate-float rounded-full bg-[#7c3aed]/10 blur-3xl [animation-delay:-3s]"
        />

        <nav aria-label="Breadcrumb" className="relative text-sm text-[#475569]">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href="/homev2" className="transition-colors hover:text-[#4338ca]">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#94a3b8]">/</li>
            <li>
              <Link href="/coursesv2" className="transition-colors hover:text-[#4338ca]">
                Courses
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#94a3b8]">/</li>
            <li className="max-w-[16rem] truncate font-medium text-[#020617]">{title}</li>
          </ol>
        </nav>

        <div className="relative mt-8 grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left column: cover, description, reviews */}
          <div className="lg:col-span-7">
            <Reveal>
              {thumbnail ? (
                <div className="relative aspect-760/430 w-full overflow-hidden rounded-2xl border border-[#e5e7eb] shadow-[0_28px_60px_-28px_rgba(2,6,23,0.45)]">
                  <Image
                    src={thumbnail}
                    alt={title}
                    fill
                    sizes="(min-width: 1024px) 640px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  className="grid aspect-760/430 w-full place-items-center rounded-2xl border border-[#e5e7eb] text-white shadow-[0_28px_60px_-28px_rgba(2,6,23,0.45)]"
                  style={{ backgroundImage: GRADIENT }}
                >
                  <Star className="size-12" />
                </div>
              )}
            </Reveal>

            {description && (
              <Reveal className="mt-12" delay={80}>
                <h2 className="font-serif text-[1.6rem] font-bold text-[#020617] sm:text-[2rem]">
                  About this course
                </h2>
                <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-[#334155]">
                  {description}
                </p>
              </Reveal>
            )}

            {reviews.length > 0 && (
              <section className="mt-14">
                <h2 className="font-serif text-[1.6rem] font-bold text-[#020617] sm:text-[2rem]">
                  Reviews ({reviews.length})
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {reviews.map((review, index) => (
                    <Reveal
                      as="li"
                      key={`${review.userName}-${review.updatedAt?.seconds ?? 0}`}
                      delay={index * 60}
                      className="flex flex-col rounded-2xl border border-[#e5e7eb] bg-white/90 p-5 shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)]"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar img="" name={review.userName} className="size-10" />
                        <div>
                          <p className="font-semibold text-[#020617]">{review.userName}</p>
                          {review.updatedAt ? (
                            <p className="text-xs text-[#64748b]">
                              {formatDate(
                                new Date(review.updatedAt.seconds * 1000).toISOString(),
                              )}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <StarDisplay value={review.value} className="mt-4" />
                      <p className="mt-3 leading-relaxed text-[#334155]">
                        {review.comment}
                      </p>
                    </Reveal>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Right column: the facts that decide the click, sticky on desktop */}
          <aside className="lg:sticky lg:top-28 lg:col-span-5">
            <Reveal>
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white/70 px-4 py-1.5 text-[0.82rem] font-medium text-[#4338ca] backdrop-blur-sm">
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

              <h1 className="mt-5 font-serif text-[clamp(1.9rem,1.25rem+2.4vw,2.75rem)] leading-[1.08] font-bold tracking-tight text-balance text-[#020617]">
                {title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                <StarRating slug={slug} rating={rating} count={ratingCount} />
                {duration ? (
                  <span className="inline-flex items-center gap-1.5 text-[0.95rem] text-[#475569]">
                    <Clock className="size-4" />
                    {calculateMinutes(duration)}
                  </span>
                ) : null}
              </div>

              <dl className="mt-8 divide-y divide-[#e2e8f0] rounded-2xl border border-[#e5e7eb] bg-[#f8fafc]/90 px-5 shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)] backdrop-blur-sm">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="flex items-baseline justify-between gap-4 py-3.5"
                  >
                    <dt className="text-[0.72rem] font-semibold tracking-[0.12em] text-[#64748b] uppercase">
                      {fact.label}
                    </dt>
                    <dd className="text-right font-semibold text-[#020617]">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6">
                <CourseActions slug={slug} launchable={!!content} />
              </div>
            </Reveal>
          </aside>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
