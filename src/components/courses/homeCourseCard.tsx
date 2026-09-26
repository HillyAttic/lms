import { BookOpen, Clock, GraduationHat, Star, LongArrowUpRight } from "@/lib/icons";
import Link from "next/link";
import { calculateMinutes } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";

/*
 * Repository content has no price, instructor or rating — only a type, so the
 * badge is the type. `tone` switches the card between the three system
 * surfaces; the homepage alternates them, listings stay on `light` so a grid
 * of mixed fills doesn't fight the thumbnails.
 */
const tones = {
  light: {
    card: "bg-white",
    muted: "text-secondary",
    rule: "border-ink/15",
    badge: "bg-ink text-accent",
  },
  lime: {
    card: "bg-accent",
    muted: "text-ink/70",
    rule: "border-ink/20",
    badge: "bg-ink text-accent",
  },
  dark: {
    card: "bg-ink text-white",
    muted: "text-white/60",
    rule: "border-white/20",
    badge: "bg-accent text-ink",
  },
} as const;

const HomeCourseCard = ({
  course,
  href,
  tone = "light",
}: {
  course: RepositoryContentItem;
  /** Detail page to browse the course on. Without it the card launches straight away. */
  href?: string;
  tone?: keyof typeof tones;
}) => {
  const t = tones[tone];

  const meta = [
    course.duration
      ? { icon: <Clock className="size-4" />, label: calculateMinutes(course.duration) }
      : null,
    course.scormVersion
      ? {
          icon: <BookOpen className="size-4" />,
          label: `SCORM ${course.scormVersion}`,
        }
      : null,
    course.interactivityLevel
      ? {
          icon: <GraduationHat className="size-4" />,
          label: `Level ${course.interactivityLevel}`,
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <article
      className={cn(
        "card-brutal card-brutal-hover group relative flex h-full flex-col overflow-hidden",
        t.card,
      )}
    >
      <div className="p-2.5 pb-0">
        <div className="relative overflow-hidden rounded-[18px]">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt=""
              loading="lazy"
              className="aspect-16/10 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <span
              className={cn(
                "grid aspect-16/10 w-full place-items-center border-[1.5px]",
                t.rule,
              )}
            >
              <Star className="size-7 opacity-30" />
            </span>
          )}
          <span
            className={cn(
              "absolute top-3 left-3 rounded-full px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.08em] uppercase",
              t.badge,
            )}
          >
            {course.type}
          </span>
        </div>
      </div>

      <div className="flex grow flex-col p-5 sm:p-6">
        {meta.length > 0 && (
          <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", t.muted)}>
            {meta.map((m) => (
              <li key={m.label} className="flex items-center gap-1.5 text-xs font-medium">
                {m.icon}
                {m.label}
              </li>
            ))}
          </ul>
        )}

        <h3 className="mt-3 grow text-lg leading-7 font-bold tracking-[-0.02em] text-balance">
          {course.name}
        </h3>

        {course.description ? (
          <p className={cn("mt-2 text-sm leading-6 line-clamp-2", t.muted)}>
            {course.description}
          </p>
        ) : null}

        <div
          className={cn(
            "mt-5 flex items-center justify-between border-t-[1.5px] pt-4",
            t.rule,
          )}
        >
          <span className="text-sm font-semibold">
            {href ? "View course" : "Start now"}
          </span>
          <span
            className={cn(
              "grid size-9 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
              tone === "dark" ? "bg-accent text-ink" : "bg-ink text-white",
            )}
          >
            <LongArrowUpRight />
          </span>
        </div>

        {/* The whole footer is the click target the arrow implies. */}
        <Link
          href={href ?? launchHref(course)}
          target={href ? undefined : "_blank"}
          rel={href ? undefined : "noopener noreferrer"}
          className="absolute inset-0 rounded-[24px]"
        >
          <span className="sr-only">
            {href ? `View ${course.name}` : `Launch ${course.name}`}
          </span>
        </Link>
      </div>
    </article>
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
