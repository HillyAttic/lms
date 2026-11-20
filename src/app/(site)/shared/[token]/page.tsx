"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getExternalShareByToken } from "@/app/actions/external-share-actions";
import LoadingSpinner from "@/components/admin/loading-spinner";

interface TimestampLike {
  seconds: number;
}

interface CourseItem {
  id: string;
  title?: string | null;
  name?: string | null;
  features?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  status?: string;
  videoUrl?: string;
  gameUrl?: string;
  source?: string;
}

interface ShareData {
  name: string;
  email: string | null;
  mobile: string | null;
  accessTypes: string[];
  expiresAt: TimestampLike | null;
  courses: {
    scorm: CourseItem[];
    video: CourseItem[];
    game: CourseItem[];
  };
}

type ContentType = "scorm" | "video" | "game";

/*
 * The three formats are told apart by their icon and label, not by hue — one
 * blue→violet accent carries the whole page, as on the landing.
 */
const contentMeta: Record<
  ContentType,
  { label: string; description: string; action: string }
> = {
  scorm: {
    label: "SCORM courses",
    description: "Structured lessons and interactive training modules.",
    action: "Launch course",
  },
  video: {
    label: "Video courses",
    description: "Expert-led lessons you can watch at your own pace.",
    action: "Watch video",
  },
  game: {
    label: "Game courses",
    description: "Put your skills into practice with interactive challenges.",
    action: "Play game",
  },
};

/* Same accent as the landing hero and CTA buttons. */
const GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";

function ContentIcon({ type, className = "h-5 w-5" }: { type: ContentType; className?: string }) {  if (type === "video") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m15 10 4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
      </svg>
    );
  }

  if (type === "game") {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m10 14 2-2m0 0 2-2m-2 2 2 2m-2-2-2-2M7.5 7.5h9A4.5 4.5 0 0 1 21 12v.5a4.5 4.5 0 0 1-8.57 1.93L12 14l-.43.43A4.5 4.5 0 0 1 3 12.5V12a4.5 4.5 0 0 1 4.5-4.5Z" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 5h6v6m-1-5-8 8m5 5H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

export default function SharedPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);

  useEffect(() => {
    if (!token) return;

    let isCurrent = true;

    const loadShareData = async () => {
      try {
        const result = await getExternalShareByToken(token);
        if (!isCurrent) return;

        if (result.success) {
          setData(result.data as ShareData);
        } else {
          setError(result.error || "Failed to load content");
        }
      } catch {
        if (isCurrent) {
          setError("Failed to load content");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    void loadShareData();

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const launchScorm = (course: CourseItem) => {
    window.open(`/api/repository/launch/${course.id}/story.html`, "_blank");
  };

  const formatDate = (timestamp: TimestampLike | null) => {
    if (!timestamp?.seconds) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl border border-[#e5e7eb] bg-white">
            <LoadingSpinner />
          </div>
          <p className="text-sm font-medium text-[#64748b]">Preparing your learning space&hellip;</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-5 py-20">
        <div className="w-full max-w-lg rounded-[24px] border border-[#eef0f4] bg-white p-8 text-center shadow-[0_16px_32px_-28px_rgba(76,29,149,0.35)] sm:p-12">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-red-200 bg-red-50 text-red-500">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3m0 4h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <p className="mb-2 text-[0.6875rem] font-bold tracking-[0.14em] text-red-500 uppercase">Unable to continue</p>
          <h1 className="display-3 text-[#0b0b12]">Access unavailable</h1>
          <p className="mt-4 text-sm leading-6 text-[#64748b]">{error}</p>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const courses = data.courses || { scorm: [], video: [], game: [] };
  const accessTypes = data.accessTypes || [];
  const totalCourses = courses.scorm.length + courses.video.length + courses.game.length;
  const availableTypes = [
    courses.scorm.length ? "SCORM" : null,
    courses.video.length ? "Video" : null,
    courses.game.length ? "Games" : null,
  ].filter(Boolean) as string[];

  const sections: { type: ContentType; items: CourseItem[] }[] = [
    { type: "scorm", items: courses.scorm },
    { type: "video", items: courses.video },
    { type: "game", items: courses.game },
  ];

  const openCourse = (type: ContentType, course: CourseItem) => {
    if (type === "scorm") {
      launchScorm(course);
    } else if (type === "video") {
      // Dedicated player page rather than the raw signed file.
      window.open(`/watch/${course.id}`, "_blank");
    } else {
      // Uploaded games have no public URL — the launch proxy serves their files.
      window.open(course.gameUrl || `/api/game/launch/${course.id}`, "_blank");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden">
      <section>
        <div className="container py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd6fe] bg-white/70 px-3.5 py-2 text-xs font-semibold tracking-wide text-[#4c1d95] backdrop-blur-sm">
                <span className="size-2 rounded-full bg-[#7c3aed]" />
                Secure shared access
              </div>
              <span className="hidden text-xs font-medium text-[#64748b] sm:block">
                EdventureHub learning space
              </span>
            </div>

            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-5">
                <div
                  className="grid size-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white sm:size-20 sm:text-3xl"
                  style={{ backgroundImage: GRADIENT }}
                >
                  {data.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="mb-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-[#6d28d9] uppercase">
                    Your curated learning space
                  </p>
                  <h1 className="display-2 max-w-2xl text-balance text-[#0b0b12]">
                    Welcome, {data.name}
                  </h1>
                  <p className="mt-4 max-w-xl leading-7 text-[#4b5563]">
                    Your invitation is ready. Choose a course below and continue
                    learning at your own pace.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white/70 px-4 py-3 text-sm text-[#475569] backdrop-blur-sm">
                <svg className="h-5 w-5 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>
                  Available until <strong className="font-semibold text-[#0b0b12]">{formatDate(data.expiresAt)}</strong>
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-2.5">
              {accessTypes.includes("scorm") && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#475569] backdrop-blur-sm">
                  <ContentIcon type="scorm" className="h-4 w-4 text-[#7c3aed]" />
                  SCORM content
                </span>
              )}
              {accessTypes.includes("video") && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#475569] backdrop-blur-sm">
                  <ContentIcon type="video" className="h-4 w-4 text-[#7c3aed]" />
                  Video content
                </span>
              )}
              {accessTypes.includes("game") && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#475569] backdrop-blur-sm">
                  <ContentIcon type="game" className="h-4 w-4 text-[#7c3aed]" />
                  Game content
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container relative z-10 pb-16 sm:pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-[#eef0f4] bg-white p-5 shadow-[0_16px_32px_-30px_rgba(76,29,149,0.35)] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.08em] text-[#64748b] uppercase">Courses available</span>
              <span className="grid size-9 place-items-center rounded-full text-white" style={{ backgroundImage: GRADIENT }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5v-14Zm0 0V20.5A2.5 2.5 0 0 1 6.5 18H20" />
                </svg>
              </span>
            </div>
            <p className="mt-1 text-3xl font-bold tracking-[-0.03em] text-[#0b0b12] tabular-nums">{totalCourses}</p>
            <p className="mt-2 text-xs text-[#64748b]">Ready when you are</p>
          </div>

          <div className="rounded-2xl border border-[#eef0f4] bg-white p-5 shadow-[0_16px_32px_-30px_rgba(76,29,149,0.35)] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.08em] text-[#64748b] uppercase">Learning formats</span>
              <span className="grid size-9 place-items-center rounded-full text-white" style={{ backgroundImage: GRADIENT }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9ZM8 9.5h.01M11 9.5h5M8 13.5h.01M11 13.5h5" />
                </svg>
              </span>
            </div>
            <p className="mt-1 text-3xl font-bold tracking-[-0.03em] text-[#0b0b12] tabular-nums">{availableTypes.length}</p>
            <p className="mt-1 truncate text-xs text-[#64748b]">{availableTypes.join(" · ") || "No formats available"}</p>
          </div>

          <div className="rounded-2xl border border-[#eef0f4] bg-white p-5 shadow-[0_16px_32px_-30px_rgba(76,29,149,0.35)] sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.08em] text-[#64748b] uppercase">Access status</span>
              <span className="grid size-9 place-items-center rounded-full text-white" style={{ backgroundImage: GRADIENT }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m5 12 4 4L19 6" />
                </svg>
              </span>
            </div>
            <p className="mt-1 text-3xl font-bold tracking-[-0.03em] text-[#0b0b12] tabular-nums">Active</p>
            <p className="mt-2 text-xs text-[#64748b]">Secure invitation link</p>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl sm:mt-20">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[0.6875rem] font-bold tracking-[0.14em] text-[#6d28d9] uppercase">Your library</p>
              <h2 className="display-2 text-[#0b0b12]">
                Start learning{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: GRADIENT }}
                >
                  today
                </span>
              </h2>
              <p className="mt-3 text-sm text-[#64748b]">
                Pick a course and make progress in a way that works for you.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-xs font-medium text-[#64748b] sm:flex">
              <span className="size-2 rounded-full bg-[#7c3aed]" />
              {totalCourses} {totalCourses === 1 ? "course" : "courses"} shared with you
            </div>
          </div>

          {totalCourses === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#d8d2e8] bg-white/50 px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3efff] text-[#7c3aed]">
                <ContentIcon type="scorm" className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#0b0b12]">No courses available yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748b]">There is no learning content attached to this share link.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {sections.map(({ type, items }) => {
                if (!items.length) return null;
                const meta = contentMeta[type];

                return (
                  <section key={type} aria-labelledby={`${type}-heading`}>
                    <div className="mb-6 flex items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-full text-white" style={{ backgroundImage: GRADIENT }}>
                        <ContentIcon type={type} className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 id={`${type}-heading`} className="text-xl font-bold tracking-[-0.02em] text-[#0b0b12]">{meta.label}</h2>
                          <span className="rounded-full bg-[#f3efff] px-2.5 py-1 text-[11px] font-semibold text-[#6d28d9]">{items.length} {items.length === 1 ? "course" : "courses"}</span>
                        </div>
                        <p className="mt-1 text-sm text-[#64748b]">{meta.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((course) => (
                        <article key={course.id} className="group flex min-h-[25rem] flex-col overflow-hidden rounded-[24px] border border-[#eef0f4] bg-white shadow-[0_16px_32px_-30px_rgba(76,29,149,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_-26px_rgba(76,29,149,0.45)]">
                          <div className="relative h-48 shrink-0 overflow-hidden border-b border-[#eef0f4] bg-[#e2e8f0]">
                            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px] border-black/5" />
                            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-black/5 blur-sm" />
                            {course.thumbnailUrl ? (
                              // Remote share thumbnails are not configured for next/image domains.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={course.thumbnailUrl} alt={course.title || course.name || "Untitled course"} loading="lazy" className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="relative z-10 flex h-full items-center justify-center text-[#94a3b8]">
                                <ContentIcon type={type} className="h-16 w-16" />
                              </div>
                            )}
                            <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white uppercase" style={{ backgroundImage: GRADIENT }}>
                              <ContentIcon type={type} className="h-3.5 w-3.5" />
                              {type}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="min-h-14 line-clamp-2 text-lg leading-7 font-bold tracking-[-0.02em] text-[#0b0b12]">
                              {course.title || course.name || "Untitled course"}
                            </h3>
                            <div className="mt-3 space-y-2 text-sm leading-5 text-[#64748b]">
                              <p className="line-clamp-2">
                                <span className="font-semibold text-[#334155]">Features:</span>{" "}
                                {course.features?.trim() || "—"}
                              </p>
                              <p className="line-clamp-3">
                                <span className="font-semibold text-[#334155]">Description:</span>{" "}
                                {course.description?.trim() || "—"}
                              </p>
                            </div>
                            <div className="mt-auto pt-6">
                              <button onClick={() => openCourse(type, course)} className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-[0_16px_32px_-16px_rgba(109,40,217,0.85)] transition-transform duration-300 hover:-translate-y-0.5" style={{ backgroundImage: GRADIENT }}>
                                <PlayIcon />
                                {meta.action}
                                <ExternalLinkIcon />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-4 rounded-2xl border border-[#e5e7eb] bg-white/60 px-5 py-4 text-center backdrop-blur-sm sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:px-6">
          <svg className="mx-auto h-5 w-5 shrink-0 text-[#7c3aed] sm:mx-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm3-8V7a3 3 0 1 1 6 0v4" />
          </svg>
          <p className="text-xs leading-5 text-[#64748b]">This content is shared through a secure link. Please keep this invitation private.</p>
        </div>
      </div>
    </main>
  );
}
