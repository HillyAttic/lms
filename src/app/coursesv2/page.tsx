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
  scorm: { label: "SCORM", color: "#2563eb", icon: IconScorm },
  video: { label: "Video", color: "#7c3aed", icon: IconVideo },
  game: { label: "Game", color: "#4338ca", icon: IconGame },
};

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=320&q=80&auto=format&fit=crop`;

/* Fallback cover art when a repository item has no thumbnail of its own. */
const TYPE_IMAGE: Record<RepositoryContentItem["type"], string> = {
  scorm: photo("1461749280684-dccba630e2f6"),
  video: photo("1531403009284-440f080d1e12"),
  game: photo("1551288049-bebda4e38f71"),
};

export default async function CoursesV2() {
  const result = await getRepositoryItems().catch(() => null);
  const courses = result?.success ? (result.data as RepositoryContentItem[]) : [];

  return (
    <div
      className="min-h-dvh overflow-hidden bg-[#f8fafc] bg-scroll text-[#334155] lg:bg-fixed"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(248,250,252,0.5), rgba(248,250,252,0.5)), url('/crumbled.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundRepeat: "no-repeat",
      }}
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
                    image={course.thumbnailUrl || TYPE_IMAGE[course.type]}
                    // Video courses have no detail route yet — see /courses.
                    href={course.type === "video" ? undefined : `/courses/${course.id}`}
                    className="h-full"
                  />
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
