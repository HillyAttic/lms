"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";

const GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";

/**
 * The /homev2 (variant O) sign-in card, in a native <dialog> so Escape, focus
 * handling and the backdrop come from the platform. Opened from the course
 * actions when a signed-out learner tries to enrol or wishlist.
 */
export default function SignInDialog({
  open,
  onDismiss,
  onSignedIn,
}: {
  open: boolean;
  /** Closed without authenticating — the pending action is dropped. */
  onDismiss: () => void;
  /** Authenticated — the caller closes and replays the pending action. */
  onSignedIn: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          toast.error("Please enter your name");
          return;
        }
        await signUpWithEmail(email, password, name);
        toast.success("Account created successfully!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Login successful!");
      }
      onSignedIn();
    } catch (error) {
      const code = (error as { code?: string })?.code;
      toast.error(
        code === "auth/email-already-in-use" ? "Email already registered"
        : code === "auth/weak-password" ? "Password must be at least 6 characters"
        : code === "auth/user-not-found" ? "No account found with this email"
        : code === "auth/wrong-password" || code === "auth/invalid-credential" ? "Invalid email or password"
        : code === "auth/invalid-email" ? "Please enter a valid email address"
        : code === "auth/too-many-requests" ? "Too many attempts. Try again later."
        : "Authentication failed",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onCancel={onDismiss} // Escape
      onClick={(event) => {
        if (event.target === ref.current) onDismiss();
      }}
      aria-labelledby="course-signin-title"
      className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-[#e5e7eb] bg-[#f8fafc]/95 p-0 text-left text-[#334155] shadow-[0_28px_60px_-28px_rgba(2,6,23,0.45)] backdrop:bg-[#020617]/50 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 text-left sm:p-7">
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close sign in"
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-[#64748b] transition-colors hover:bg-[#e2e8f0] hover:text-[#020617]"
        >
          ×
        </button>

        <form onSubmit={handleSubmit}>
          <h2
            id="course-signin-title"
            className="font-serif text-[1.35rem] font-semibold text-[#020617]"
          >
            {mode === "signup" ? "Create your account" : "Sign in"}
          </h2>

          <div className="mt-4 space-y-3.5">
            {mode === "signup" && (
              <div>
                <label htmlFor="course-signin-name" className="text-[0.82rem] text-[#475569]">
                  Full name
                </label>
                <input
                  id="course-signin-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-[0.95rem] text-[#334155] focus:border-[#6366f1] focus:outline-none"
                />
              </div>
            )}
            <div>
              <label htmlFor="course-signin-email" className="text-[0.82rem] text-[#475569]">
                Email address
              </label>
              <input
                id="course-signin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-[0.95rem] text-[#334155] focus:border-[#6366f1] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="course-signin-password" className="text-[0.82rem] text-[#475569]">
                Password
              </label>
              <input
                id="course-signin-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-[0.95rem] text-[#334155] focus:border-[#6366f1] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg px-4 py-2.5 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ backgroundImage: GRADIENT }}
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <div className="mt-3 flex items-center justify-between text-[0.82rem] text-[#475569]">
            <Link href="/admin/login" className="hover:underline">
              Forgot password?
            </Link>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-medium text-[#4338ca] hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
