import { Metadata } from "next";
import type { ReactElement } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";
import { siteName } from "@/utils/envExport";
import { LandingFooter, LandingHeader } from "@/components/landing";
import { ProtectedRoute } from "@/lib/protected-route";

export const metadata: Metadata = {
  title: `All Courses | ${siteName}`,
  description: "Every course on EdVenture LMS in one place.",
};

type Type = RepositoryContentItem["type"];

const TYPE_META: Record<
  Type,
  { badge: string; module: string; tint: string; text: string }
> = {
  scorm: {
    badge: "SCORM",
    module: "Interactive Module",
    tint: "bg-[#f3efff]",
    text: "text-[#6d28d9]",
  },
  video: {
    badge: "Video",
    module: "Video Lesson",
    tint: "bg-[#eaf2ff]",
    text: "text-[#2563eb]",
  },
  game: {
    badge: "Game",
    module: "Interactive Game",
    tint: "bg-[#fff5e5]",
    text: "text-[#b45309]",
  },
};

/*
 * ponytail: every item's stored thumbnail is the same placeholder upload, so
 * covers cycle a curated web set (matched to the reference grid) by position.
 * Switch `src` back to `course.thumbnailUrl` once each course has its own image.
 */
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=500&q=80&auto=format&fit=crop",
];

const blurb = (c: RepositoryContentItem) =>
  c.description || c.features || "Open the course to see what it covers.";

const level = (c: RepositoryContentItem) =>
  c.type === "scorm" && c.interactivityLevel
    ? `Level ${c.interactivityLevel}`
    : c.type === "video"
      ? "Self-paced"
      : "Interactive";

const PlayCircle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M10 8.5l5.5 3.5L10 15.5v-7z" fill="currentColor" stroke="none" />
  </svg>
);

const Sparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none" />
  </svg>
);

const OpenBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden>
    <path d="M12 6.5C10.5 5 8.5 4.5 5 4.5v13c3.5 0 5.5.5 7 2 1.5-1.5 3.5-2 7-2v-13c-3.5 0-5.5.5-7 2z" />
    <path d="M12 6.5v13" />
  </svg>
);

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden>
    <rect x="3" y="6" width="12" height="12" rx="2.5" />
    <path d="M15 11l5-3v8l-5-3z" />
  </svg>
);

const Bolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden>
    <path d="M13 3L5 13h5l-1 8 8-10h-5l1-8z" fill="currentColor" stroke="none" />
  </svg>
);

const ArrowOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden>
    <path d="M14 5h5v5M19 5l-7 7" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </svg>
);

const LEVEL_ICON: Record<Type, () => ReactElement> = {
  scorm: PlayCircle,
  video: VideoIcon,
  game: Sparkle,
};

const MODULE_ICON: Record<Type, () => ReactElement> = {
  scorm: OpenBook,
  video: VideoIcon,
  game: Bolt,
};

export default async function Courses() {
  const result = await getRepositoryItems().catch(() => null);
  const courses = result?.success ? (result.data as RepositoryContentItem[]) : [];

  return (
    <ProtectedRoute loginHref="/admin/login">
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh overflow-hidden bg-scroll text-[#334155] lg:bg-fixed">
      <LandingHeader active="courses" accent="#4338ca" />

      <main className="mx-auto max-w-[1500px] px-6 py-14 lg:px-14">
        <h1 className="font-serif text-[1.9rem] font-bold text-[#020617] sm:text-[2.4rem]">
          Our Courses
        </h1>
        <p className="mt-3 max-w-[36rem] text-[1.05rem] leading-relaxed text-[#334155]">
          {courses.length > 0
            ? `${courses.length} course${courses.length === 1 ? "" : "s"} across every format on the platform.`
            : "Courses published from the admin panel will appear here."}
        </p>

        {courses.length > 0 ? (
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-7">
            {courses.map((course, index) => {
              const meta = TYPE_META[course.type];
              const LevelIcon = LEVEL_ICON[course.type];
              const ModuleIcon = MODULE_ICON[course.type];
              const cover = COVER_IMAGES[index % COVER_IMAGES.length];
              return (
                <li key={`${course.type}-${course.id}`} className="h-full">
                  <Link
                    href={`/courses/${course.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#eef0f4] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_16px_32px_-24px_rgba(16,24,40,0.28)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(16,24,40,0.06),0_22px_40px_-22px_rgba(16,24,40,0.35)]"
                  >
                    <div className="relative h-[200px] shrink-0 overflow-hidden bg-[#e2e8f0] sm:h-[230px]">
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/70 via-[#0b1220]/10 to-[#0b1220]/5" />
                      <span className="absolute left-4 top-4 rounded-md bg-white/95 px-3 py-1.5 text-[0.78rem] font-semibold text-[#0f172a] shadow-sm backdrop-blur">
                        {meta.badge}
                      </span>
                      <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[0.85rem] font-medium text-white drop-shadow">
                        <LevelIcon />
                        {level(course)}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                      <h3 className="line-clamp-2 text-[1.15rem] font-bold leading-snug text-[#0b1220] transition-colors group-hover:text-[#5b21b6]">
                        {course.name}
                      </h3>
                      <p className="mt-2.5 line-clamp-2 text-[0.9rem] leading-relaxed text-[#64748b]">
                        {blurb(course)}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-6">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.82rem] font-semibold ${meta.tint} ${meta.text}`}
                        >
                          <ModuleIcon />
                          {meta.module}
                          {course.duration ? ` • ${course.duration} min` : null}
                        </span>
                        <span className="text-[#94a3b8] transition-colors group-hover:text-[#5b21b6]">
                          <ArrowOut />
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-10 rounded-2xl border border-[#e5e7eb] bg-white px-6 py-16 text-center shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)]">
            <p className="font-serif text-[1.3rem] font-bold text-[#020617]">
              No courses published yet
            </p>
            <p className="mt-2 text-[0.95rem] text-[#475569]">
              Check back soon — new material lands here as it goes live.
            </p>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
    </ProtectedRoute>
  );
}
