"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "@/lib/icons";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";
import HomeCourseCard from "./homeCourseCard";

const CourseRow = ({ courses }: { courses: RepositoryContentItem[] }) => {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  return (
    <div className="relative">
      {courses.length > 3 && (
        <>
          <button
            type="button"
            aria-label="Previous courses"
            onClick={() => scroll(-1)}
            className="absolute top-1/3 -left-4 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow-md transition-colors hover:text-purple-500 sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next courses"
            onClick={() => scroll(1)}
            className="absolute top-1/3 -right-4 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow-md transition-colors hover:text-purple-500 sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
      <div
        ref={ref}
        className="flex snap-x gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((course) => (
          <div key={course.id} className="w-70 shrink-0 snap-start sm:w-80">
            <HomeCourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseRow;
