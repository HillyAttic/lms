"use client";

import { useState, useMemo } from "react";
import { categoryData } from "@/components/categories/categoryData";
import HomeCourseCard from "@/components/courses/homeCourseCard";
import Input from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "@/lib/icons";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";

const CoursesDsiplay = ({
  courses,
  initialCategory = "",
}: {
  courses: RepositoryContentItem[];
  initialCategory?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);

  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return courses.filter((course) => {
      if (selectedCategory && course.type !== selectedCategory) return false;
      if (!query) return true;
      return (
        course.name.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.features.toLowerCase().includes(query)
      );
    });
  }, [courses, searchQuery, selectedCategory]);

  return (
    <div className="bg-gray-50 pt-11 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-28">
      <div className="container">
        {/* search and category */}
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4">
          <div className="relative h-11 w-full sm:h-12 sm:max-w-85">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <Input
              placeholder="Search course here..."
              className="h-full bg-primary pr-7 pl-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue
                placeholder="Category"
                placeholderClass="text-secondary"
              />
            </SelectTrigger>
            <SelectContent>
              {categoryData.map((item) => (
                <SelectItem key={item._id} value={item.slug.current}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* courses — same card the homepage rows use, so launching behaves alike.
            Video keeps its dedicated player; SCORM and games browse on their own
            detail page first, which is where "Enroll Now" leads into the player. */}
        <div className="grid gap-6 pt-11 pb-11 sm:grid-cols-2 sm:pb-14 lg:grid-cols-3 lg:pb-16">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <HomeCourseCard
                key={course.id}
                course={course}
                href={
                  course.type === "video" ? undefined : `/courses/${course.id}`
                }
              />
            ))
          ) : (
            <div className="col-span-full py-10 text-center">
              <p className="text-lg text-secondary">
                No courses found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesDsiplay;
