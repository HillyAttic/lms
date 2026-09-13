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

const contentMeta: Record<
  ContentType,
  {
    label: string;
    eyebrow: string;
    description: string;
    action: string;
    gradient: string;
    accent: string;
    softAccent: string;
  }
> = {
  scorm: {
    label: "SCORM courses",
    eyebrow: "Interactive learning",
    description: "Explore structured lessons and interactive training modules.",
    action: "Launch course",
    gradient: "from-[#7651ef] via-[#6339d8] to-[#4d26b7]",
    accent: "text-purple-700",
    softAccent: "bg-purple-50 text-purple-700 ring-purple-100",
  },
  video: {
    label: "Video courses",
    eyebrow: "Learn on demand",
    description: "Watch expert-led lessons at your own pace, wherever you are.",
    action: "Watch video",
    gradient: "from-[#38bdf8] via-[#168bd4] to-[#1765b5]",
    accent: "text-sky-700",
    softAccent: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  game: {
    label: "Game courses",
    eyebrow: "Learn by doing",
    description: "Put your skills into practice with engaging challenges and games.",
    action: "Play game",
    gradient: "from-[#45c98d] via-[#20a875] to-[#13815f]",
    accent: "text-emerald-700",
    softAccent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
};

function ContentIcon({ type, className = "h-5 w-5" }: { type: ContentType; className?: string }) {
  if (type === "video") {
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
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 ring-1 ring-purple-100">
            <LoadingSpinner />
          </div>
          <p className="text-sm font-medium text-gray-500">Preparing your learning space...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7f8fc] px-4 py-20">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl shadow-gray-200/50 sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3m0 4h.01M10.29 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-red-600">Unable to continue</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">Access unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">{error}</p>
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
      window.open(course.videoUrl || "#", "_blank");
    } else {
      window.open(course.gameUrl || "#", "_blank");
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-gray-950">
      <section className="relative isolate overflow-hidden bg-[#171326]">
        <div className="absolute -right-32 -top-44 h-[30rem] w-[30rem] rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute -bottom-56 left-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="container relative py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-white/85 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                Secure shared access
              </div>
              <span className="hidden text-xs font-medium text-white/45 sm:block">EdventureHub learning space</span>
            </div>

            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-300 to-purple-500 text-2xl font-semibold text-white shadow-lg shadow-purple-950/30 ring-1 ring-white/20 sm:h-20 sm:w-20 sm:text-3xl">
                  {data.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-purple-200">Your curated learning space</p>
                  <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Welcome, {data.name}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                    Your invitation is ready. Choose a course below and continue learning at your own pace.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white/75 backdrop-blur-sm">
                <svg className="h-5 w-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>
                  Available until <strong className="font-semibold text-white">{formatDate(data.expiresAt)}</strong>
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-2.5">
              {accessTypes.includes("scorm") && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/10">
                  <ContentIcon type="scorm" className="h-4 w-4 text-purple-300" />
                  SCORM content
                </span>
              )}
              {accessTypes.includes("video") && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/10">
                  <ContentIcon type="video" className="h-4 w-4 text-sky-300" />
                  Video content
                </span>
              )}
              {accessTypes.includes("game") && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/85 ring-1 ring-white/10">
                  <ContentIcon type="game" className="h-4 w-4 text-emerald-300" />
                  Game content
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container relative z-10 -mt-6 pb-16 sm:-mt-8 sm:pb-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-lg shadow-gray-200/40 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Courses available</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 0 4 20.5v-14Zm0 0V20.5A2.5 2.5 0 0 1 6.5 18H20" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-gray-950">{totalCourses}</p>
            <p className="mt-1 text-xs text-gray-400">Ready when you are</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-lg shadow-gray-200/40 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Learning formats</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9ZM8 9.5h.01M11 9.5h5M8 13.5h.01M11 13.5h5" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-gray-950">{availableTypes.length}</p>
            <p className="mt-1 truncate text-xs text-gray-400">{availableTypes.join(" · ") || "No formats available"}</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-lg shadow-gray-200/40 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Access status</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m5 12 4 4L19 6" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-gray-950">Active</p>
            <p className="mt-1 text-xs text-gray-400">Secure invitation link</p>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl sm:mt-20">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Your library</p>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Start learning today</h2>
              <p className="mt-2 text-sm text-gray-500">Pick a course and make progress in a way that works for you.</p>
            </div>
            <div className="hidden items-center gap-2 text-xs font-medium text-gray-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {totalCourses} {totalCourses === 1 ? "course" : "courses"} shared with you
            </div>
          </div>

          {totalCourses === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <ContentIcon type="scorm" className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900">No courses available yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">There is no learning content attached to this share link.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {sections.map(({ type, items }) => {
                if (!items.length) return null;
                const meta = contentMeta[type];

                return (
                  <section key={type} aria-labelledby={`${type}-heading`}>
                    <div className="mb-6 flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.softAccent} ring-1`}>
                        <ContentIcon type={type} className={`h-5 w-5 ${meta.accent}`} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 id={`${type}-heading`} className="text-xl font-semibold tracking-tight text-gray-950">{meta.label}</h2>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500">{items.length} {items.length === 1 ? "course" : "courses"}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{meta.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((course) => (
                        <article key={course.id} className="group flex min-h-[25rem] flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40 transition-all duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl hover:shadow-gray-200/60">
                          <div className={`relative h-48 shrink-0 overflow-hidden bg-gradient-to-br ${meta.gradient}`}>
                            <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[18px] border-white/10" />
                            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-sm" />
                            {course.thumbnailUrl ? (
                              // Remote share thumbnails are not configured for next/image domains.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={course.thumbnailUrl} alt={course.title || course.name || "Untitled course"} loading="lazy" className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="relative z-10 flex h-full items-center justify-center text-white/60">
                                <ContentIcon type={type} className="h-16 w-16" />
                              </div>
                            )}
                            <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/20 backdrop-blur-md">
                              <ContentIcon type={type} className="h-3.5 w-3.5" />
                              {type}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="min-h-14 line-clamp-2 text-lg font-semibold leading-7 tracking-tight text-gray-950">
                              {course.title || course.name || "Untitled course"}
                            </h3>
                            <div className="mt-3 space-y-2 text-sm leading-5 text-gray-600">
                              <p className="line-clamp-2">
                                <span className="font-semibold text-gray-900">Features:</span>{" "}
                                {course.features?.trim() || "—"}
                              </p>
                              <p className="line-clamp-3">
                                <span className="font-semibold text-gray-900">Description:</span>{" "}
                                {course.description?.trim() || "—"}
                              </p>
                            </div>
                            <div className="mt-auto pt-6">
                              <button onClick={() => openCourse(type, course)} className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${meta.gradient} px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-lg hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2`}>
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

        <div className="mx-auto mt-16 flex max-w-7xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-center shadow-sm sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:px-6">
          <svg className="mx-auto h-5 w-5 shrink-0 text-gray-400 sm:mx-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm3-8V7a3 3 0 1 1 6 0v4" />
          </svg>
          <p className="text-xs leading-5 text-gray-500">This content is shared through a secure link. Please keep this invitation private.</p>
        </div>
      </div>
    </main>
  );
}
