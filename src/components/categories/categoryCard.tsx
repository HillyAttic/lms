import { GamepadIcon, LongArrowUpRight, Video, FileStack } from "@/lib/icons";
import { CategoryType } from "@/types/CategoryType";
import Link from "next/link";
import { ReactElement } from "react";
import { cn } from "@/lib/utils";

function categoryIconFinder(category: string) {
  const icons: Record<string, ReactElement> = {
    "SCORM Courses": <FileStack />,
    "Video Courses": <Video />,
    "Game Courses": <GamepadIcon />,
  };
  return icons[category];
}

/* One of each surface, so the row reads white → ink → lime. */
const surfaces = [
  {
    card: "bg-white",
    muted: "text-secondary",
    rule: "border-ink/15",
    chip: "border-ink/20 text-secondary",
    num: "text-ink/25",
  },
  {
    card: "bg-ink text-white",
    muted: "text-white/60",
    rule: "border-white/20",
    chip: "border-white/25 text-white/70",
    num: "text-white/25",
  },
  {
    card: "bg-accent",
    muted: "text-ink/70",
    rule: "border-ink/20",
    chip: "border-ink/30 text-ink/80",
    num: "text-ink/25",
  },
];

const CategoryCard = ({
  category,
  index,
}: {
  category: CategoryType;
  index: number;
}) => {
  const s = surfaces[index % surfaces.length];

  return (
    <Link
      href={`/courses?category=${category.slug.current}`}
      className={cn(
        "card-brutal card-brutal-hover group flex h-full flex-col",
        s.card,
      )}
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-0 sm:p-7 sm:pb-0">
        <span
          className={cn(
            "text-5xl leading-none font-bold tracking-[-0.04em] sm:text-6xl",
            s.num,
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors sm:size-12",
            s.chip,
          )}
        >
          {categoryIconFinder(category.title)}
        </span>
      </div>

      <div className="flex grow flex-col p-6 sm:p-7">
        <h3 className="display-3">{category.title}</h3>
        <p className={cn("mt-3 text-sm leading-6", s.muted)}>
          {category.description}
        </p>

        <div
          className={cn(
            "mt-6 flex items-center justify-between border-t-[1.5px] pt-5",
            s.rule,
          )}
        >
          <span
            className={cn(
              "text-xs font-semibold tracking-[0.08em] uppercase",
              s.muted,
            )}
          >
            {category.courseCount}{" "}
            {category.courseCount === 1 ? "course" : "courses"}
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <LongArrowUpRight />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
