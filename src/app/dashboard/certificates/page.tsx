"use client";

import { Certificate } from "@/lib/icons";
import {
  LearnerCourseCard,
  LearnerEmptyState,
  LearnerPageHeading,
  LearnerPager,
  useLearnerDashboard,
  usePage,
} from "../learner-courses";

/**
 * A certificate is a completing SCORM progress record, and its "download" is
 * the same browser print-to-PDF the platform already offers — see
 * /dashboard/certificates/[slug]. Nothing is stored for it.
 */
export default function CertificatesPage() {
  const { data, loading } = useLearnerDashboard();
  const certificates = data?.certificates || [];
  const { page, setPage, hasMore, visible } = usePage(certificates);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div>
        <LearnerPageHeading title="Certificates" count={0} icon={Certificate} />
        <LearnerEmptyState message="Finish a course to earn your first certificate." />
      </div>
    );
  }

  return (
    <div>
      <LearnerPageHeading
        title="Certificates"
        count={certificates.length}
        icon={Certificate}
      />

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((course) => (
          <LearnerCourseCard key={course.slug} course={course} action="Download" />
        ))}
      </ul>

      <LearnerPager page={page} onPageChange={setPage} hasMore={hasMore} />
    </div>
  );
}
