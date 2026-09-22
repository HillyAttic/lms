"use client";

import { GraduationHat } from "@/lib/icons";
import {
  LearnerCourseCard,
  LearnerEmptyState,
  LearnerPageHeading,
  LearnerPager,
  useLearnerDashboard,
  usePage,
} from "../learner-courses";

export default function EnrolledCoursesPage() {
  const { data, loading } = useLearnerDashboard();
  const enrolled = data?.enrolled || [];
  const { page, setPage, hasMore, visible } = usePage(enrolled);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (enrolled.length === 0) {
    return (
      <div>
        <LearnerPageHeading title="Enrolled Courses" count={0} icon={GraduationHat} />
        <LearnerEmptyState message="You haven't enrolled in a course yet." />
      </div>
    );
  }

  return (
    <div>
      <LearnerPageHeading
        title="Enrolled Courses"
        count={enrolled.length}
        icon={GraduationHat}
      />

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((course) => (
          <LearnerCourseCard key={course.slug} course={course} />
        ))}
      </ul>

      <LearnerPager page={page} onPageChange={setPage} hasMore={hasMore} />
    </div>
  );
}
