import SectionTitle from "../sectionTitle";
import Button from "../ui/button";
import Link from "next/link";
import ButtonArrow from "../ui/buttonArrow";
import HomeCourseCard from "./homeCourseCard";
import Reveal from "../ui/reveal";
import {
  getRepositoryItemsByType,
  type RepositoryContentItem,
  type RepositoryContentType,
} from "@/app/actions/repository-actions";

/*
 * The heading links to the listing; the featured course below is the single
 * newest item across all three collections, so it is always real content.
 * (`/?category=` is not wired up here — the listing reads `category` on mount
 * only, so link filters through it rather than pretending to re-render.)
 */
const Courses = async () => {
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

  const featured = all[0];
  const rest = all.slice(1, 7);

  if (!featured) return null;

  return (
    <section className="border-t-[1.5px] border-ink bg-muted py-16 sm:py-20 lg:py-28">
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            subTitle="Courses"
            description="Explore courses designed around practical skills, taught by people who use them daily."
          >
            Learn something <span className="marker">new</span>
          </SectionTitle>
          <Button asChild variant="outline" size="lg" className="max-sm:w-full">
            <Link href="/courses">
              <span>View all courses</span>
              <ButtonArrow />
            </Link>
          </Button>
        </div>

        <Reveal className="mt-12 sm:mt-14">
          <FeaturedCourse course={featured} />
        </Reveal>

        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((course, i) => (
            <Reveal as="li" key={course.id} delay={i * 70}>
              <HomeCourseCard
                course={course}
                href={
                  course.type === "video" ? undefined : `/courses/${course.id}`
                }
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
};

/* Asymmetric split: copy on the ink panel, artwork on the lime panel. */
const FeaturedCourse = ({ course }: { course: RepositoryContentItem }) => {
  return (
    <article className="card-brutal overflow-hidden bg-ink text-white">
      <div className="grid lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-8 p-7 lg:col-span-7 lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[0.6875rem] font-bold tracking-[0.08em] text-ink uppercase">
                {course.type}
              </span>
              <span className="text-xs font-semibold tracking-[0.1em] text-white/50 uppercase">
                Featured course
              </span>
            </div>

            <h3 className="display-2 mt-5 text-balance">{course.name}</h3>

            {course.description ? (
              <p className="mt-5 max-w-xl leading-7 text-white/65 line-clamp-3">
                {course.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button asChild variant="accent" size="lg" className="max-sm:w-full">
              <Link
                href={`/courses/${course.id}`}
                className="[&_span:last-child]:bg-ink [&_span:last-child]:text-accent"
              >
                <span>Explore course</span>
                <ButtonArrow />
              </Link>
            </Button>
            {course.duration ? (
              <span className="text-sm font-medium text-white/60">
                {course.duration} min
              </span>
            ) : null}
          </div>
        </div>

        {/* Lime panel: the artwork sits on the accent, not on another photo. */}
        <div className="relative flex items-center justify-center bg-accent p-7 lg:col-span-5 lg:p-0">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt=""
              loading="lazy"
              className="aspect-4/3 w-full object-cover lg:h-full lg:aspect-auto"
            />
          ) : (
            <span className="grid aspect-4/3 w-full place-items-center lg:h-full">
              <span className="display-1 text-ink/20">
                {course.name.slice(0, 2).toUpperCase()}
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default Courses;
