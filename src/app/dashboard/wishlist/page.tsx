"use client";

import { Heart } from "@/lib/icons";
import {
  LearnerCourseCard,
  LearnerEmptyState,
  LearnerPageHeading,
  LearnerPager,
  useLearnerDashboard,
  usePage,
} from "../learner-courses";

export default function WishlistPage() {
  const { data, loading } = useLearnerDashboard();
  const wishlist = data?.wishlist || [];
  const { page, setPage, hasMore, visible } = usePage(wishlist);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div>
        <LearnerPageHeading title="Wishlist" count={0} icon={Heart} />
        <LearnerEmptyState message="Courses you save land here." />
      </div>
    );
  }

  return (
    <div>
      <LearnerPageHeading title="Wishlist" count={wishlist.length} icon={Heart} />

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((course) => (
          <LearnerCourseCard key={course.slug} course={course} action="View" />
        ))}
      </ul>

      <LearnerPager page={page} onPageChange={setPage} hasMore={hasMore} />
    </div>
  );
}
