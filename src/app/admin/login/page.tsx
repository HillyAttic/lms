"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Logo, LogoMark } from "@/lib/icons";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import { HeroIllustration } from "@/components/illustrations";

/*
 * One page for sign in and sign up — `/admin` is just where the route lives.
 * The server assigns the role, so this screen no longer claims to be creating
 * an admin account.
 *
 * All auth logic is unchanged; only the presentation moved.
 */
export default function AdminLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();
  // Reused verbatim by /adminv2; land in that tree's home after auth.
  const home =
    typeof window !== "undefined" && window.location.pathname.startsWith("/adminv2")
      ? "/homev2"
      : "/";

  // Redirect to homepage if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace(home);
    }
  }, [user, loading, router, home]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        toast.success("Login successful!");
      } else {
        if (!name.trim()) {
          toast.error("Please enter your name");
          return;
        }
        await signUpWithEmail(email, password, name);
        toast.success("Account created successfully!");
      }
      router.push(home);
    } catch (error: any) {
      const message = error.code === "auth/user-not-found"
        ? "No account found with this email"
        : error.code === "auth/wrong-password"
        ? "Incorrect password"
        : error.code === "auth/email-already-in-use"
        ? "Email already registered"
        : error.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : error.code === "auth/invalid-email"
        ? "Please enter a valid email address"
        : error.code === "auth/weak-password"
        ? "Password must be at least 6 characters"
        : error.code === "auth/operation-not-allowed"
        ? "Email/password sign-in is not enabled. Please contact the administrator."
        : error.code === "auth/too-many-requests"
        ? "Too many failed attempts. Please try again later."
        : error.message || "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Login successful!");
      router.push(home);
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const field =
    "mt-2 block h-12 w-full rounded-full border-[1.5px] border-ink/15 bg-white px-5 text-sm placeholder:text-gray-400 focus-visible:border-ink focus-visible:outline-none";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Editorial panel. Decorative only — no form lives here, so it is safe to
          drop entirely on narrow screens. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-dark p-12 text-white lg:flex">
        <Link href="/" aria-label="EdventureHub home" className="self-start">
          <Logo />
        </Link>

        <div className="max-w-md">
          <h2 className="display-2 text-balance">
            Learn the skill.
            <br />
            Build the <span className="marker">career</span>.
          </h2>
          <p className="mt-6 leading-8 text-white/60 text-pretty">
            Practical, self-paced courses with progress you can see — and
            certificates when you finish.
          </p>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -bottom-16 w-96 opacity-90">
          <HeroIllustration />
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-col justify-center bg-background px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="lg:hidden" aria-label="EdventureHub home">
            <Logo />
          </Link>

          <h1 className="display-3 mt-10 lg:mt-0">
            {isLogin ? (
              <>
                Welcome <span className="marker">back</span>
              </>
            ) : (
              <>
                Create your <span className="marker">account</span>
              </>
            )}
          </h1>
          <p className="mt-4 leading-7 text-secondary">
            {isLogin
              ? "Sign in to continue your courses."
              : "Start learning in under a minute."}
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="text-sm font-semibold">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={field}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-semibold">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
                placeholder="you@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? "Please wait…"
                : isLogin
                  ? "Sign in"
                  : "Create account"}
              {!loading && <ButtonArrow />}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <span className="h-px grow bg-ink/15" />
            <span className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">
              or
            </span>
            <span className="h-px grow bg-ink/15" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-ink bg-white text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="mt-7 text-center text-sm text-secondary">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-ink underline underline-offset-4 hover:text-secondary"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-secondary">
            <LogoMark className="size-4" />
            <Link href="/" className="hover:text-ink">
              Back to EdventureHub
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
