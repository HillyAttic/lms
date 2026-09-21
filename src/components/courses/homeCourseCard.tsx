"use client";
import { BookOpen, Clock, GraduationHat, Star } from "@/lib/icons";
import Button from "../ui/button";
import ButtonArrow from "../ui/buttonArrow";
import { calculateMinutes } from "@/lib/utils";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";

const typeColors: Record<string, string> = {
  scorm: "bg-blue-500",
  video: "bg-green-500",
  game: "bg-orange-500",
};

/** Real repository content has no price, instructor or rating; just the type badge. */
const HomeCourseCard = ({ course }: { course: RepositoryContentItem }) => {
  const thumbnail = course.thumbnailUrl;

  return (
    <div className="flex h-full flex-col rounded-3xl bg-primary px-2 pt-2 pb-6">
      <div className="relative">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={course.name}
            loading="lazy"
            className="aspect-373/218 w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="grid aspect-373/218 w-full place-items-center rounded-2xl bg-gray-50 text-gray-400">
            <Star className="size-8" />
          </div>
        )}
        <div
          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold text-white uppercase ${typeColors[course.type]}`}
        >
          {course.type}
        </div>
      </div>

      <div className="flex grow flex-col pt-5 sm:px-4">
        <ul className="flex flex-wrap items-center gap-2.5 pb-4">
          {course.duration ? (
            <li className="flex max-h-6.5 items-center gap-1 pt-1 pb-1 leading-4.5 text-secondary">
              <Clock className="size-4" />
              <span className="text-xs leading-4.5">
                {calculateMinutes(course.duration)}
              </span>
            </li>
          ) : null}
          {course.scormVersion ? (
            <li className="flex max-h-6.5 items-center gap-1 pt-1 pb-1 leading-4.5 text-secondary">
              <BookOpen className="size-4 stroke-[0.75]" />
              <span className="text-xs leading-4.5">
                SCORM {course.scormVersion}
              </span>
            </li>
          ) : null}
          {course.interactivityLevel ? (
            <li className="flex max-h-6.5 items-center gap-1 pt-1 pb-1 leading-4.5 text-secondary">
              <GraduationHat className="size-4" />
              <span className="text-xs leading-4.5">
                Level {course.interactivityLevel}
              </span>
            </li>
          ) : null}
        </ul>

        <h5 className="grow font-medium md:text-lg md:leading-7">
          {course.name}
        </h5>
        {course.description ? (
          <small className="mt-2 block text-sm leading-5 tracking-sm text-secondary line-clamp-2">
            {course.description}
          </small>
        ) : null}

        <div className="mt-7">
          <Button asChild variant="outline" size="lg" className="w-full">
            <a
              href={launchHref(course)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Launch Course
              <ButtonArrow />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Same launch routes the repository page uses, so both entry points behave alike. */
function launchHref(course: RepositoryContentItem) {
  if (course.type === "video") return `/watch/${course.id}`;
  if (course.type === "game")
    return course.gameUrl || `/api/game/launch/${course.id}`;
  return `/api/repository/launch/${course.id}/${course.entryPoint || "story.html"}`;
}

export default HomeCourseCard;
