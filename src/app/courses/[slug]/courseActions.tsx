"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import { Heart } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getLearnerCourseState, setEnrollment, setWishlist } from "@/app/actions/learner-actions";

/**
 * Enrolling is a deliberate click — it is what puts the course on the learner's
 * dashboard — so the button writes the enrollment before handing them to the
 * player. The heart is the separate, reversible "not yet" the wishlist holds.
 */
export default function CourseActions({
  slug,
  launchable,
}: {
  slug: string;
  /** False when no repository content is linked yet — the player has nothing to show. */
  launchable: boolean;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [flags, setFlags] = useState<{
    uid: string;
    enrolled: boolean;
    wishlisted: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;

    let isCurrent = true;
    void (async () => {
      const result = await getLearnerCourseState(await user.getIdToken(), slug);
      if (!isCurrent || !result.success) return;
      setFlags({ uid: user.uid, ...result.data });
    })();

    return () => {
      isCurrent = false;
    };
  }, [user, slug]);

  // Flags belong to the learner they were read for: another account — or none —
  // reads as "not enrolled, not saved" without a render to reset them.
  const mine = flags?.uid === user?.uid ? flags : null;
  const enrolled = mine?.enrolled || false;
  const wishlisted = mine?.wishlisted || false;

  /** Both buttons wait on the same token round trip, so one lock covers them. */
  const withToken = async (run: (idToken: string) => Promise<{ success: boolean; error?: string }>) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await run(await user.getIdToken());
      if (!result.success) toast.error(result.error || "Something went wrong.");
      return result;
    } finally {
      setBusy(false);
    }
  };

  const handleEnroll = async () => {
    if (loading) return;
    if (!user) {
      toast.info("Sign in to enroll in this course.");
      return;
    }
    const result = await withToken((idToken) => setEnrollment(idToken, slug, true));
    if (!result?.success) return;
    setFlags((current) => ({ uid: user.uid, enrolled: true, wishlisted: current?.wishlisted || false }));
    router.push(`/courses/${slug}/launch`);
  };

  const handleWishlist = async () => {
    if (loading) return;
    if (!user) {
      toast.info("Sign in to save this course to your wishlist.");
      return;
    }
    const next = !wishlisted;
    const result = await withToken((idToken) => setWishlist(idToken, slug, next));
    if (!result?.success) return;
    setFlags((current) => ({ uid: user.uid, enrolled: current?.enrolled || false, wishlisted: next }));
    toast.success(next ? "Saved to your wishlist." : "Removed from your wishlist.");
  };

  if (!launchable) {
    return (
      <Button size="lg" disabled className="max-sm:w-full">
        Content coming soon
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {enrolled ? (
        <Button asChild variant="accent" size="lg" className="max-sm:w-full">
          <Link href={`/courses/${slug}/launch`}>
            <span>Continue course</span>
            <ButtonArrow />
          </Link>
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={handleEnroll}
          disabled={busy}
          className="max-sm:w-full"
        >
          <span>{busy ? "Enrolling…" : "Enrol now"}</span>
          {!busy && <ButtonArrow />}
        </Button>
      )}

      <button
        type="button"
        onClick={handleWishlist}
        disabled={busy}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
          wishlisted
            ? "border-ink bg-accent text-ink"
            : "border-ink/20 text-secondary hover:border-ink hover:text-ink",
        )}
      >
        <Heart className={cn("size-5", wishlisted && "fill-current")} />
      </button>
    </div>
  );
}
