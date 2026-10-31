"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Heart } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getLearnerCourseState, setEnrollment, setWishlist } from "@/app/actions/learner-actions";
import SignInDialog from "./signInDialog";

const GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";

/**
 * /coursesv2 actions — same enroll/wishlist behaviour as the /courses page's
 * CourseActions, restyled for the Motion theme. Behaviour is duplicated rather
 * than themed through props so the classic page stays untouched; fold the two
 * together if this page becomes the only detail route.
 */
export default function CourseActionsV2({
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
  const [signInOpen, setSignInOpen] = useState(false);
  // The click that opened the sign-in box, replayed once auth resolves.
  const pendingAction = useRef<"enroll" | "wishlist" | null>(null);

  const openSignIn = (action: "enroll" | "wishlist") => {
    pendingAction.current = action;
    setSignInOpen(true);
  };

  const dismissSignIn = () => {
    pendingAction.current = null;
    setSignInOpen(false);
  };

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

  const mine = flags?.uid === user?.uid ? flags : null;
  const enrolled = mine?.enrolled || false;
  const wishlisted = mine?.wishlisted || false;

  const withToken = async (
    run: (idToken: string) => Promise<{ success: boolean; error?: string }>,
  ) => {
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
      // No dead-end toast: the same sign-in box the landing page uses, so the
      // learner can authenticate without losing the course.
      openSignIn("enroll");
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
      openSignIn("wishlist");
      return;
    }
    const next = !wishlisted;
    const result = await withToken((idToken) => setWishlist(idToken, slug, next));
    if (!result?.success) return;
    setFlags((current) => ({ uid: user.uid, enrolled: current?.enrolled || false, wishlisted: next }));
    toast.success(next ? "Saved to your wishlist." : "Removed from your wishlist.");
  };

  // Replay the click that opened the sign-in box once auth resolves. Waits for
  // `loading` so the action never runs against a half-settled auth state.
  useEffect(() => {
    if (loading || !user || !pendingAction.current) return;
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action === "enroll") void handleEnroll();
    else void handleWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers are recreated per render; only auth settling should replay
  }, [user, loading]);

  if (!launchable) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full items-center justify-center rounded-xl border border-[#e5e7eb] bg-white/80 px-6 py-3 text-[0.95rem] font-medium text-[#64748b]"
      >
        Content coming soon
      </button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={enrolled ? () => router.push(`/courses/${slug}/launch`) : handleEnroll}
        disabled={busy}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        style={{ backgroundImage: GRADIENT }}
      >
        {enrolled ? "Continue course" : busy ? "Enrolling…" : "Enrol now"}
        {!busy && <span aria-hidden="true">→</span>}
      </button>

      <button
        type="button"
        onClick={handleWishlist}
        disabled={busy}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition-colors",
          wishlisted
            ? "border-transparent text-white"
            : "border-[#e5e7eb] bg-white/80 text-[#4338ca] hover:bg-white",
        )}
        style={wishlisted ? { backgroundImage: GRADIENT } : undefined}
      >
        <Heart className={cn("size-5", wishlisted && "fill-current")} />
      </button>
      </div>

      <SignInDialog
        open={signInOpen}
        onDismiss={dismissSignIn}
        onSignedIn={() => setSignInOpen(false)}
      />
    </>
  );
}
