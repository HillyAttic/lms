"use client";

/* PROTOTYPE — the /homev2?variant=A structure, rendered against a theme.
 * Same sections in the same order; only the theme tokens and grid split change. */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  IconArrowLeft, IconChevron, IconGradCap,
  courses, benefits, contactRows, useLoginForm,
} from "./shared";
import type { Theme } from "./themes";

export function ThemedHome({ theme }: { theme: Theme }) {
  const f = useLoginForm();
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const scrollCourses = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 240) + 20), behavior: "smooth" });
  };

  const trackEdges = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    const onResize = () => trackEdges();
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line)] bg-[var(--card)] text-[color:var(--ink)] shadow-sm transition-opacity disabled:opacity-40";

  return (
    <div className={theme.shell} style={{ ...theme.vars, background: "var(--page)", backgroundImage: "var(--page-image)", backgroundSize: "var(--page-size)", backgroundPosition: "var(--page-position, center)", backgroundRepeat: "var(--page-repeat, repeat)" } as CSSProperties}>
      {/* header — same anatomy as LandingHeader, themed */}
      <header className="border-b border-[color:var(--line)]">
        <div className={`${theme.wide} flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5`}>
          <Link href="/homev2?variant=A" className="flex shrink-0 items-center gap-3 whitespace-nowrap">
            <IconGradCap className="h-9 w-9" style={{ color: "var(--accent)" }} />
            <span className={`${theme.heading} text-[1.55rem] font-bold tracking-tight`} style={{ color: "var(--ink)" }}>
              EdVenture <span style={{ color: "var(--accent)" }}>LMS</span>
            </span>
          </Link>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-6 text-[1.02rem] sm:gap-10">
              <li><a href="#courses" className="border-b-2 pb-1 font-medium" style={{ borderColor: "var(--accent)" }}>Home</a></li>
              <li><Link href="/coursesv2" className="hover:opacity-70">Courses</Link></li>
              <li><a href="#why-us" className="hover:opacity-70">About Us</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className={`${theme.container} ${theme.heroGrid}`}>
        <div className={theme.heroText}>
          <h1 className={`${theme.heading} text-[clamp(2.15rem,9vw,3.9rem)]`} style={{ color: "var(--ink)" }}>
            Welcome to <br />
            <span style={{ color: "var(--accent)" }}>EdVenture LMS</span>
          </h1>
          <p className="mt-6 max-w-[30rem] text-[1.22rem] leading-relaxed">
            Empowering your organization with personalized, interactive learning and growth.
          </p>

          <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
            <Image src="/img.png" alt="" aria-hidden="true" width={400} height={328} className="h-auto w-[180px] shrink-0 sm:w-[200px]" />
            <div className="text-center sm:pb-2 sm:text-left">
              <p className={`${theme.heading} text-[1.35rem]`} style={{ color: "var(--ink)" }}>Trusted by</p>
              <div className="mt-3 flex justify-center gap-3 sm:justify-start sm:gap-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="flex h-12 w-12 items-center justify-center rounded-[var(--radius)] text-2xl font-bold"
                    style={{
                      background: i === 1 ? "var(--accent2)" : "var(--ink)",
                      color: "var(--card)",
                      fontFamily: "var(--font-head)",
                    }}
                  >
                    {["a", "b", "c"][i]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* login card */}
        <aside className={theme.heroAside}>
          <div className={`mx-auto w-full max-w-[340px] ${theme.loginCard}`}>
            <div className="space-y-3">
              <a href="#courses" className={`flex items-center justify-center gap-2 text-[0.95rem] font-medium ${theme.btnView}`} style={{ background: "var(--accent)" }}>
                <IconGradCap className="h-5 w-5" /> View Courses
              </a>
              <a href="#login" onClick={() => f.setMode("login")} className={`block text-[0.95rem] font-medium ${theme.btnLogin}`}>
                Login
              </a>
              <button type="button" onClick={() => f.setMode("signup")} className={`block w-full text-[0.95rem] font-medium ${theme.btnSignup}`} style={{ background: "var(--accent2)", color: "var(--card)" }}>
                Sign Up
              </button>
            </div>

            <form id="login" onSubmit={f.handleSubmit} className="mt-5">
              <h2 className="text-[1.05rem] font-semibold" style={{ color: "var(--ink)" }}>
                {f.mode === "signup" ? "Create your account" : "Login"}
              </h2>
              <div className="mt-4 space-y-4">
                {f.mode === "signup" && (
                  <div>
                    <label htmlFor="th-name" className="text-[0.82rem]">Full Name</label>
                    <input id="th-name" type="text" autoComplete="name" required value={f.name} onChange={(e) => f.setName(e.target.value)}
                      className={`mt-1 w-full text-[0.95rem] focus:outline-none ${theme.input}`} />
                  </div>
                )}
                <div>
                  <label htmlFor="th-email" className="text-[0.82rem]">Email Address</label>
                  <input id="th-email" type="email" autoComplete="email" required value={f.email} onChange={(e) => f.setEmail(e.target.value)}
                    className={`mt-1 w-full text-[0.95rem] focus:outline-none ${theme.input}`} />
                </div>
                <div>
                  <label htmlFor="th-password" className="text-[0.82rem]">Password</label>
                  <input id="th-password" type="password" autoComplete={f.mode === "signup" ? "new-password" : "current-password"} required minLength={6}
                    value={f.password} onChange={(e) => f.setPassword(e.target.value)}
                    className={`mt-1 w-full text-[0.95rem] focus:outline-none ${theme.input}`} />
                </div>
              </div>
              <button type="submit" disabled={f.loading} className={`mt-5 w-full text-[0.95rem] font-medium disabled:opacity-60 ${theme.btnSubmit}`} style={{ background: "var(--ink)" }}>
                {f.loading ? "Please wait…" : f.mode === "signup" ? "Create Account" : "Sign In"}
              </button>
              <p className="mt-3 text-right text-[0.82rem]">
                <Link href="/admin/login" className="hover:underline">Forgot Password?</Link>
              </p>
              <p className="mt-4 text-center text-[0.85rem]">
                {f.mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                <button type="button" onClick={f.toggleMode} className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                  {f.mode === "signup" ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </form>
          </div>
        </aside>
      </section>

      {/* courses */}
      <section id="courses" className="border-t border-[color:var(--line)]">
        <div className={`${theme.container} py-14`}>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <h2 className={`${theme.heading} text-[1.6rem] font-bold sm:text-[2rem]`} style={{ color: "var(--ink)" }}>Our Courses</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollCourses(-1)} aria-label="Previous courses" disabled={edges.start} className={navBtn}>
                  <IconArrowLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => scrollCourses(1)} aria-label="Next courses" disabled={edges.end} className={navBtn}>
                  <IconChevron className="h-4 w-4" />
                </button>
              </div>
              <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium whitespace-nowrap sm:text-[1.02rem]" style={{ color: "var(--accent)" }}>
                View All <IconChevron className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <div ref={scroller} onScroll={trackEdges} className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {courses.map(({ title, copy, level, icon: Icon }, i) => (
                <article key={title} className={`flex ${theme.cardWidth} shrink-0 snap-start flex-col overflow-hidden ${theme.card}`}>
                  <div className={`flex shrink-0 items-center justify-center ${theme.tile}`} style={{ background: i % 2 ? "var(--accent2)" : "var(--accent)" }}>
                    <Icon className="h-9 w-9" style={{ color: "var(--card)" }} />
                  </div>
                  <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                    <h3 className={`${theme.heading} text-[1.12rem] font-bold leading-snug`} style={{ color: "var(--ink)" }}>{title}</h3>
                    <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed">{copy}</p>
                    <p className="mt-4 text-[0.82rem] font-medium" style={{ color: level === "Beginner" ? "var(--accent2)" : "var(--muted)" }}>
                      {level}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* why us + contact */}
      <section id="why-us" className="border-t border-[color:var(--line)]">
        <div className={`${theme.container} ${theme.whyGrid}`}>
          <div className={theme.whyText}>
            <h2 className={`${theme.heading} text-[2rem] font-bold`} style={{ color: "var(--ink)" }}>Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold" style={{ color: "var(--ink)" }}>
              Built for learners, not for completion rates
            </h3>
            <p className="mt-4 max-w-[36rem] leading-relaxed">
              EdVentureHub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
            <p className="mt-4 max-w-[36rem] leading-relaxed">
              So we built something different. Every course is broken into short, focused lessons
              with something to do at the end of each one — a quiz, a project, a checkpoint. You
              move at your own pace, and your dashboard keeps score so progress is visible instead
              of imaginary.
            </p>

            <ul className="mt-8 space-y-6">
              {benefits.map(({ text, icon: Icon }) => (
                <li key={text} className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }}>
                    <Icon className="h-9 w-9" />
                  </span>
                  <span className="max-w-[32rem] text-[0.98rem] leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={theme.whyAside}>
            <div className={`${theme.loginCard} p-5 sm:p-7`}>
              <ul className="divide-y divide-[color:var(--line)]">
                {contactRows.map(({ icon: Icon, title, lines }) => (
                  <li key={title} className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4 sm:py-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14" style={{ background: "var(--sage)", color: "var(--ink)" }}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.92rem] font-semibold sm:text-[0.95rem]" style={{ color: "var(--ink)" }}>{title}</p>
                      <div className="mt-1 space-y-0.5 text-[0.88rem] leading-relaxed break-words sm:text-[0.92rem]">
                        {lines.map((line) => <p key={line}>{line}</p>)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[color:var(--line)]">
        <div className={`${theme.wide} flex flex-col items-center justify-between gap-3 py-6 text-[0.95rem] sm:flex-row`}>
          <p>© 2026 EdVentureHub</p>
          <p className="flex items-center gap-3">
            <Link href="/" className="hover:underline">Privacy Policy</Link>
            <span aria-hidden="true" className="h-4 w-px" style={{ background: "var(--line)" }} />
            <Link href="/" className="hover:underline">Terms &amp; Conditions</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
