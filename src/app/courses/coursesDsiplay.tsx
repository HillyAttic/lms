"use client";

import { useState, useMemo } from "react";
import HomeCourseCard from "@/components/courses/homeCourseCard";
import Input from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, CloseIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";

/*
 * Filters are limited to what the data actually carries. Repository items have
 * `type`, `duration`, `createdAt`, and (SCORM only) `interactivityLevel` — there
 * is no `category`, `level` or `instructor` field, so the UI does not offer one.
 *
 * The template's single dropdown was labelled "Category" but compared against
 * `course.type`; it is now labelled Type, which is what it always did.
 */
const TYPES = [
  { value: "all", label: "All" },
  { value: "scorm", label: "SCORM" },
  { value: "video", label: "Video" },
  { value: "game", label: "Games" },
];

const LEVELS = ["1", "2", "2.5", "3"];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "az", label: "Title A–Z" },
  { value: "shortest", label: "Shortest first" },
  { value: "longest", label: "Longest first" },
];

const CoursesDsiplay = ({
  courses,
  initialCategory = "",
}: {
  courses: RepositoryContentItem[];
  initialCategory?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [type, setType] = useState(initialCategory || "all");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matched = courses.filter((course) => {
      if (type !== "all" && course.type !== type) return false;
      if (level && String(course.interactivityLevel) !== level) return false;
      if (!query) return true;
      return (
        course.name.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.features?.toLowerCase().includes(query)
      );
    });

    return matched.sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "shortest") return (a.duration || 0) - (b.duration || 0);
      if (sort === "longest") return (b.duration || 0) - (a.duration || 0);
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
  }, [courses, searchQuery, type, level, sort]);

  const hasFilters = Boolean(searchQuery || level || type !== "all");

  const clearAll = () => {
    setSearchQuery("");
    setType("all");
    setLevel("");
  };

  return (
    <div className="bg-background pt-10 pb-16 sm:pt-12 sm:pb-20 lg:pb-28">
      <div className="container">
        <div className="relative max-w-xl">
          <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <Input
            type="search"
            aria-label="Search courses"
            placeholder="Search courses…"
            className="pr-7 pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Chips scroll horizontally on narrow screens rather than wrapping
            into a tall stack above the results. */}
        <div className="-mx-5 mt-6 overflow-x-auto px-5 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            role="group"
            aria-label="Filter by course type"
            className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap"
          >
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={type === t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "rounded-full border-[1.5px] border-ink px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  type === t.value
                    ? "bg-ink text-white"
                    : "bg-white text-ink hover:bg-accent",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-44">
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All levels</SelectItem>
                {LEVELS.map((l) => (
                  <SelectItem key={l} value={l}>
                    Level {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p
            aria-live="polite"
            className="ml-auto text-sm font-medium text-secondary"
          >
            {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
            {hasFilters ? ` of ${courses.length}` : ""}
          </p>
        </div>

        {filteredCourses.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <li key={course.id}>
                <HomeCourseCard
                  course={course}
                  href={
                    course.type === "video" ? undefined : `/courses/${course.id}`
                  }
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="card-brutal mt-10 bg-white px-6 py-16 text-center">
            <p className="text-xl font-bold tracking-[-0.02em]">
              No courses match those filters
            </p>
            <p className="mx-auto mt-3 max-w-md leading-7 text-secondary">
              Level filters only apply to SCORM courses — the other formats
              don&apos;t carry a level. Try widening the search.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="mt-7 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                <CloseIcon />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesDsiplay;
