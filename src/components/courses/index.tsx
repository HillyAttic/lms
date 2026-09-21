import SectionTitle from "../sectionTitle";
import Button from "../ui/button";
import Link from "next/link";
import ButtonArrow from "../ui/buttonArrow";
import CourseRow from "./courseRow";
import {
  getRepositoryItemsByType,
  type RepositoryContentItem,
  type RepositoryContentType,
} from "@/app/actions/repository-actions";

const categories: {
  title: string;
  description: string;
  type?: RepositoryContentType;
}[] = [
  {
    title: "All Courses",
    description: "Browse all available training programs",
  },
  {
    title: "SCORM Courses",
    description: "Interactive SCORM-based learning modules",
    type: "scorm",
  },
  {
    title: "Video Courses",
    description: "Learn through short, high-quality video lessons",
    type: "video",
  },
  {
    title: "Games",
    description: "Play and learn with fun interactive skill-based challenges",
    type: "game",
  },
];

const Courses = async () => {
  // "All Courses" reuses the three typed lists instead of a fourth read — the
  // concatenation keeps `loadRepositoryContent`'s newest-first order because
  // each list is already sorted that way and the sections are shown separately.
  const all = (
    await Promise.all(
      (["scorm", "video", "game"] as RepositoryContentType[]).map(
        async (type) => {
          const result = await getRepositoryItemsByType(type);
          return result.success ? (result.data as RepositoryContentItem[]) : [];
        },
      ),
    )
  )
    .flat()
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  return (
    <section className="bg-gray-50 py-16 sm:py-20 lg:py-28">
      <div className="container flex flex-col gap-16 sm:gap-20 lg:gap-28">
        {categories.map((row) => {
          const items = row.type ? all.filter((i) => i.type === row.type) : all;

          if (!items.length) return null;

          return (
            <div key={row.title}>
              <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-5">
                <SectionTitle
                  subTitle="Our Courses"
                  description={row.description}
                  titleClassName="text-[clamp(1.5rem,1.1087rem+1.7391vw,2.5rem)]"
                >
                  {row.title}
                </SectionTitle>
                <Button asChild size="lg" className="py-1.5 pr-1.5 pl-6 max-sm:w-full">
                  <Link href="/courses">
                    <span className="w-full text-center">View all</span>
                    <ButtonArrow />
                  </Link>
                </Button>
              </div>
              <div className="pt-11 sm:pt-14 lg:pt-16">
                <CourseRow courses={items} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Courses;
