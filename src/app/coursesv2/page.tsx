import { Metadata } from "next";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";
import { siteName } from "@/utils/envExport";
import { LandingFooter, LandingHeader } from "@/components/landing";
import {
  CourseGridPrototype,
  PrototypeSwitcher,
  type PrototypeVariant,
} from "./course-grid-prototype";

export const metadata: Metadata = {
  title: `All Courses | ${siteName}`,
  description: "Every course on EdVenture LMS in one place.",
};

export default async function CoursesV2({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const result = await getRepositoryItems().catch(() => null);
  const courses = result?.success ? (result.data as RepositoryContentItem[]) : [];
  // PROTOTYPE: ?variant= picks the grid; C is the original card grid.
  const requested = (await searchParams).variant;
  const variant: PrototypeVariant =
    requested === "B" || requested === "C" || requested === "D" || requested === "E"
      ? requested
      : "A";

  return (
    <div
      className="theme-v2 theme-v2-page theme-v2-static min-h-dvh overflow-hidden bg-scroll text-[#334155] lg:bg-fixed"
    >
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
          <CourseGridPrototype courses={courses} variant={variant} />
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
      <PrototypeSwitcher current={variant} />
    </div>
  );
}
