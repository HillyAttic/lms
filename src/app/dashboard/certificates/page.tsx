"use client";

import { Certificate } from "@/lib/icons";
import {
  LearnerCourseCard,
  LearnerEmptyState,
  LearnerPageHeading,
  useLearnerDashboard,
} from "../learner-courses";

/**
 * A certificate is a completing SCORM progress record, and its "download" is
 * the same browser print-to-PDF the platform already offers — see
 * /dashboard/certificates/[slug]. Nothing is stored for it.
 */
export default function CertificatesPage() {
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
        title="Certificates"
        count={data?.certificates.length}
        icon={Certificate}
      />

      {data?.certificates.length ? (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.certificates.map((course) => (
            <LearnerCourseCard key={course.slug} course={course} action="Download" />
          ))}
        </ul>
      ) : (
        <LearnerEmptyState message="Finish a course to earn your first certificate." />
      )}
    </div>
  );
}
