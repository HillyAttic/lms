"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Star } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";
import { submitRating } from "@/app/actions/public-course-actions";

interface StarRatingProps {
  slug: string;
  rating: number;
  count: number;
  className?: string;
}

/**
 * The stars open a small form rather than writing on click, so a learner can
 * rate and review in one submit. On success the page revalidates and the parent
 * re-renders with the new figures.
 */
export function StarRating({ slug, rating, count, className }: StarRatingProps) {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Stars
          value={rating}
          onSelect={() => {
            // `user` is null until auth resolves; ignore clicks until then
            // rather than telling a signed-in learner to sign in.
            if (loading) return;
            if (!user) {
              toast.info("Sign in to rate this course.");
              return;
            }
            setOpen(true);
          }}
        />
        <span className="text-sm text-gray-500">
          {rating.toFixed(1)} ({count})
        </span>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selected || saving) return;

    setSaving(true);
    const result = await submitRating(
      slug,
      selected,
      await user.getIdToken(),
      comment,
    );
    setSaving(false);

    if (!result.success) {
      toast.error(result.error || "Could not save your rating.");
      return;
    }

    setOpen(false);
    setComment("");
    setSelected(0);
    toast.success("Thanks for rating this course!");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-4 shadow-xs",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Stars
          value={selected || hovered}
          onSelect={setSelected}
          onHover={setHovered}
        />
        <span className="text-sm text-gray-500">
          {selected ? `${selected} of 5` : "Pick a rating"}
        </span>
      </div>

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        placeholder="Share what you thought of this course (optional)"
        className="mt-3 min-h-[96px]"
      />

      <div className="mt-3 flex items-center gap-2">
        <Button type="submit" disabled={!selected || saving} className="px-5">
          {saving ? "Saving..." : "Submit"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={saving}
          className="px-5"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Presentational star row — the caller decides what a click means. */
function Stars({
  value,
  onSelect,
  onHover,
  disabled,
}: {
  value: number;
  onSelect: (value: number) => void;
  onHover?: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <ul className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <li key={star}>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Rate ${star} out of 5`}
            onClick={() => onSelect(star)}
            onMouseEnter={() => onHover?.(star)}
            onMouseLeave={() => onHover?.(0)}
            onFocus={() => onHover?.(star)}
            onBlur={() => onHover?.(0)}
            className="cursor-pointer rounded transition-transform hover:scale-110 disabled:cursor-not-allowed"
          >
            <Star
              className={cn(
                "size-6 text-gray-300",
                star <= Math.round(value) && "fill-yellow-400 text-yellow-400",
              )}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
