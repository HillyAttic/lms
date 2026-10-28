import { Metadata } from "next";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";
import { siteName } from "@/utils/envExport";
import {
  LandingFooter,
  LandingHeader,
  LandingCourseCard,
  NAVY,
  GREEN,
  TEAL,
  SLATE,
} from "@/components/landing";

export const metadata: Metadata = {
  title: `All Courses | ${siteName}`,
  description: "Every course on EdVenture LMS in one place.",
};

/* ---------- type icons, same line style as /homev2's cards ---------- */

const Svg = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className ?? "h-6 w-6"}
  >
    {children}
  </svg>
);

const IconScorm = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
  </Svg>
);
const IconVideo = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="2" y="6" width="13" height="12" rx="2" />
    <path d="m15 11 7-4v10l-7-4" />
  </Svg>
);
const IconGame = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z" />
    <path d="M7 12h4M9 10v4M16 11h.01M18.5 13h.01" />
  </Svg>
);

/* One palette slot per content type, so the grid reads at a glance. */
const TYPE_STYLES: Record<
  RepositoryContentItem["type"],
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  scorm: { label: "SCORM", color: NAVY, icon: IconScorm },
  video: { label: "Video", color: TEAL, icon: IconVideo },
  game: { label: "Game", color: GREEN, icon: IconGame },
};

export default async function CoursesV2() {
  const result = await getRepositoryItems().catch(() => null);
  const courses = result?.success ? (result.data as RepositoryContentItem[]) : [];

  return (
    <div className="min-h-dvh bg-[url('/crumbled.jpg')] bg-cover bg-center bg-scroll text-[#243040] lg:bg-fixed">
      <LandingHeader active="courses" />

      <main className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
        <h1 className="font-serif text-[1.9rem] font-bold sm:text-[2.4rem]" style={{ color: NAVY }}>
          Our Courses
        </h1>
        <p className="mt-3 max-w-[36rem] text-[1.05rem] leading-relaxed text-[#46505e]">
          {courses.length > 0
            ? `${courses.length} course${courses.length === 1 ? "" : "s"} across every format on the platform.`
            : "Courses published from the admin panel will appear here."}
        </p>

        {courses.length > 0 ? (
          <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => {
              const style = TYPE_STYLES[course.type];
              return (
                <li key={`${course.type}-${course.id}`}>
                  <LandingCourseCard
                    title={course.name}
                    description={
                      course.description ||
                      course.features ||
                      "Open the course to see what it covers."
                    }
                    label={style.label}
                    color={style.color}
                    icon={style.icon}
                    // Video courses have no detail route yet — see /courses.
                    href={course.type === "video" ? undefined : `/courses/${course.id}`}
                    className="h-full"
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-10 rounded-2xl border border-[#e6e2d8] bg-[#fdfcf9]/95 px-6 py-16 text-center shadow-[0_16px_36px_-20px_rgba(18,48,91,0.4)]">
            <p className="font-serif text-[1.3rem] font-bold" style={{ color: NAVY }}>
              No courses published yet
            </p>
            <p className="mt-2 text-[0.95rem] text-[#4a5563]">
              Check back soon — new material lands here as it goes live.
            </p>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
