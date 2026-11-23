import Link from "next/link";
import Breadcrumb from "@/components/breadcrumb";
import ScormLaunch from "./scorm-launch";
import VideoPlayer from "@/components/admin/video-player";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import {
  getPublicCourseBySlug,
  type PublicCourse,
} from "@/app/actions/public-course-actions";
import {
  getLaunchableItemById,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

/*
 * Firestore costs a round trip per call and this page gates the course frame.
 * The metadata changes rarely, so a result is remembered briefly; misses for a
 * shorter while, so a course just created in the admin shows up in seconds.
 *
 * The map lives on `globalThis`: `next dev` re-instantiates page modules on
 * every render, so module scope would be empty each time.
 */
const HIT_TTL_MS = 30_000;
const MISS_TTL_MS = 5_000;
const store = globalThis as {
  __launchLookups?: Map<string, { at: number; ttl: number; data: unknown }>;
};
const lookups = (store.__launchLookups ??= new Map());
async function memoLookup<T extends { success: boolean }>(
  key: string,
  load: () => Promise<T>
): Promise<T> {
  const hit = lookups.get(key);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.data as T;
  const result = await load();
  if (lookups.size > 200) lookups.clear();
  lookups.set(key, {
    at: Date.now(),
    ttl: result.success ? HIT_TTL_MS : MISS_TTL_MS,
    data: result,
  });
  return result;
}

/*
 * Server-rendered: the two lookups used to run as client-side server-action
 * calls, so every visit paid a spinner, two browser round trips and then
 * started the SCORM iframe only afterwards.
 */
export default async function CourseLaunchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // The slug may name a `public_courses` record or, when none was created,
  // the repository upload itself — see the detail page for the same fallback.
  // Both are looked up together: the upload-id case is the common one, and
  // waiting for the course query first would add a needless round trip.
  const [publicResult, directResult] = await Promise.all([
    memoLookup(`course:${slug}`, () => getPublicCourseBySlug(slug)),
    // No thumbnail on this page: signing one is pure latency here.
    memoLookup(`item:${slug}`, () =>
      getLaunchableItemById(slug, { thumbnail: false })
    ),
  ]);
  const publicCourse = publicResult.success
    ? (publicResult.data as PublicCourse)
    : null;

  const contentId = publicCourse?.contentId;
  const itemResult =
    contentId && contentId !== slug
      ? await memoLookup(`item:${contentId}`, () =>
          getLaunchableItemById(contentId, { thumbnail: false })
        )
      : directResult;
  const content = itemResult.success
    ? (itemResult.data as RepositoryContentItem)
    : null;
  const title = publicCourse?.title || content?.name || "Course";

  const error = content
    ? null
    : publicCourse
      ? "No content is linked to this course yet."
      : "Course not found";

  return (
    <main className="bg-background py-10 sm:py-14">
      {/* Every package asset is redirected to Storage; open the connection
          while the document is still arriving. */}
      <link rel="preconnect" href="https://storage.googleapis.com" />
      <div className="container">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: title, href: `/courses/${slug}` },
            { label: "Assessment" },
          ]}
        />

        <div className="mx-auto mt-8 max-w-5xl">
          {error ? (
            <div className="card-brutal bg-white px-6 py-16 text-center">
              <h2 className="display-3">{error}</h2>
              <p className="mx-auto mt-3 max-w-md leading-7 text-secondary">
                Please check back later or browse the catalogue.
              </p>
              <Button asChild variant="accent" size="lg" className="mt-7">
                <Link href="/courses">
                  Browse courses
                  <ButtonArrow />
                </Link>
              </Button>
            </div>
          ) : content?.type === "scorm" ? (
            <>
              <ScormLaunch
                course={{
                  id: content.id,
                  title: content.name,
                  scormVersion: content.scormVersion || "1.2",
                  scormStructure: {
                    entryPoint: content.entryPoint || "story.html",
                  },
                }}
              />
              <h2 className="display-3 mt-8 text-center">
                {title || content.name}
              </h2>
            </>
          ) : content?.type === "video" ? (
            <VideoPlayer
              videoUrl={content.videoUrl || ""}
              thumbnailUrl={content.thumbnailUrl}
              title={content.name}
            />
          ) : content?.type === "game" ? (
            <div className="aspect-16/9 overflow-hidden rounded-[24px] border-[1.5px] border-ink bg-black">
              <iframe
                src={content.gameUrl || `/api/game/launch/${content.id}`}
                title={content.name}
                className="h-full w-full border-0"
                allowFullScreen
              />
            </div>
          ) : null}

          <div className="mt-8 text-center">
            <Link
              href={`/courses/${slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
            >
              <ButtonArrow />
              Back to course details
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
