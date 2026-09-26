import Avatar from "@/components/ui/avatar";
import { StarDisplay } from "@/components/ui/starDisplay";
import { formatDate } from "@/lib/utils";
import type { CourseReview } from "@/app/actions/public-course-actions";

/** Written reviews, newest first — stars-only ratings are filtered out server-side. */
export function CourseReviews({ reviews }: { reviews: CourseReview[] }) {
  if (!reviews.length) return null;

  return (
    <section className="mt-12">
      <h2 className="display-3">Reviews ({reviews.length})</h2>

      <ul className="mt-6 grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <li
            key={`${review.userName}-${review.updatedAt?.seconds ?? 0}`}
            className="card-brutal bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <Avatar img="" name={review.userName} className="size-10" />
              <div>
                <p className="font-semibold text-foreground">
                  {review.userName}
                </p>
                {review.updatedAt ? (
                  <p className="text-xs text-gray-500">
                    {formatDate(
                      new Date(review.updatedAt.seconds * 1000).toISOString(),
                    )}
                  </p>
                ) : null}
              </div>
            </div>

            <StarDisplay value={review.value} className="mt-4" />
            <p className="mt-3 leading-relaxed text-secondary">
              {review.comment}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
