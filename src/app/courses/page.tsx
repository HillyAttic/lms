import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";
import { siteName } from "@/utils/envExport";
import { LandingFooter, LandingHeader } from "@/components/landing";

export const metadata: Metadata = {
  title: `All Courses | ${siteName}`,
  description: "Every course on EdVenture LMS in one place.",
};

const TYPE_STYLES: Record<RepositoryContentItem["type"], { label: string; color: string }> = {
  scorm: { label: "SCORM", color: "#2563eb" },
  video: { label: "Video", color: "#7c3aed" },
  game: { label: "Game", color: "#4338ca" },
};

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=320&q=80&auto=format&fit=crop`;
const TYPE_IMAGE: Record<RepositoryContentItem["type"], string> = {
  scorm: photo("1461749280684-dccba630e2f6"),
  video: photo("1531403009284-440f080d1e12"),
  game: photo("1551288049-bebda4e38f71"),
};

const blurb = (c: RepositoryContentItem) =>
  c.description || c.features || "Open the course to see what it covers.";

export default async function Courses() {
  const result = await getRepositoryItems().catch(() => null);
  const courses = result?.success ? (result.data as RepositoryContentItem[]) : [];

  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh overflow-hidden bg-scroll text-[#334155] lg:bg-fixed">
      <LandingHeader active="courses" accent="#4338ca" />

      <main className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
        <h1 className="font-serif text-[1.9rem] font-bold text-[#020617] sm:text-[2.4rem]">
          Our Courses
        </h1>
        <p className="mt-3 max-w-[36rem] text-[1.05rem] leading-relaxed text-[#334155]">
          {courses.length > 0
            ? `${courses.length} course${courses.length === 1 ? "" : "s"} across every format on the platform.`
            : "Courses published from the admin panel will appear here."}
        </p>

        {courses.length > 0 ? (
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => {
              const style = TYPE_STYLES[course.type];
              return (
                <li key={`${course.type}-${course.id}`} className="h-full">
                  <Link
                    href={`/courses/${course.id}`}
                    className="group flex h-[360px] flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)] transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="relative h-1/2 shrink-0 overflow-hidden bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]">
                      <Image
                        src={course.thumbnailUrl || TYPE_IMAGE[course.type]}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex h-1/2 flex-col px-4 pt-4 pb-4">
                      <h3 className="line-clamp-2 font-serif text-[1.12rem] font-bold leading-snug text-[#020617]">{course.name}</h3>
                      <p className="mt-2 line-clamp-3 text-[0.86rem] leading-relaxed text-[#475569]">{blurb(course)}</p>
                      <p className="mt-auto pt-3 text-[0.82rem] font-medium" style={{ color: style.color }}>
                        {style.label}
                        {course.duration ? <span className="text-[#6b7280]"> · {course.duration} min</span> : null}
                      </p>
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
  );
}
