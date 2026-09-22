"use client";

import { GraduationHat } from "@/lib/icons";
import {
  LearnerCourseCard,
  LearnerEmptyState,
  LearnerPageHeading,
  useLearnerDashboard,
} from "../learner-courses";

export default function EnrolledCoursesPage() {
  const { data, loading } = useLearnerDashboard();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <LearnerPageHeading
        title="Enrolled Courses"
        count={data?.enrolled.length}
        icon={GraduationHat}
      />

      {data?.enrolled.length ? (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.enrolled.map((course) => (
            <LearnerCourseCard key={course.slug} course={course} />
          ))}
        </ul>
      ) : (
        <LearnerEmptyState message="You haven't enrolled in a course yet." />
      )}
    </div>
  );
}
