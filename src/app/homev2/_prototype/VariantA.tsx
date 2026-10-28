"use client";

/* PROTOTYPE — Variant A: the current /homev2 page, unchanged, as the baseline. */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { LandingFooter, LandingHeader } from "@/components/landing";
import {
  NAVY, GREEN, TEAL, SLATE, SAGE,
  IconArrowLeft, IconChevron, IconGradCap,
  courses, benefits, contactRows, useLoginForm,
} from "./shared";

export function VariantA() {
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

  const navBtn = "flex h-9 w-9 items-center justify-center rounded-full border border-[#d9d4c7] bg-[#fdfcf9] shadow-sm transition-opacity disabled:opacity-40";

  return (
    <div className="min-h-dvh bg-[url('/crumbled.jpg')] bg-cover bg-center bg-scroll text-[#243040] lg:bg-fixed">
      <LandingHeader active="home" />

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 py-14 lg:grid-cols-12 lg:gap-10 lg:py-16">
        <div className="lg:col-span-7">
          <h1 className="font-serif text-[clamp(2.15rem,9vw,3.9rem)] leading-[1.08] tracking-tight" style={{ color: NAVY }}>
            Welcome to
            <br />
            <span style={{ color: GREEN }}>EdVenture LMS</span>
          </h1>
          <p className="mt-6 max-w-[30rem] text-[1.22rem] leading-relaxed text-[#39434f]">
            Empowering your organization with personalized, interactive learning and growth.
          </p>
          <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
            <Image src="/img.png" alt="" aria-hidden="true" width={400} height={328} className="h-auto w-[180px] shrink-0 sm:w-[200px]" />
            <div className="text-center sm:pb-2 sm:text-left">
              <p className="font-serif text-[1.35rem] text-[#2c3644]">Trusted by</p>
              <div className="mt-3 flex justify-center gap-3 sm:justify-start sm:gap-4">
                {[
                  { letter: "a", bg: NAVY, fg: "#fff" },
                  { letter: "b", bg: "#8c99a3", fg: "#fff" },
                  { letter: "c", bg: SLATE, fg: "#fff" },
                ].map((tile) => (
                  <span key={tile.letter} aria-label={`Trusted partner ${tile.letter}`} className="flex h-12 w-12 items-center justify-center rounded-lg font-serif text-2xl font-bold shadow-sm" style={{ background: tile.bg, color: tile.fg }}>
                    {tile.letter}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="mx-auto w-full max-w-[340px] rounded-2xl border border-white/60 bg-white/90 p-6 shadow-[0_18px_40px_-18px_rgba(18,48,91,0.35)] backdrop-blur-sm">
            <div className="space-y-3">
              <a href="#courses" className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[0.95rem] font-medium text-white" style={{ background: GREEN }}>
                <IconGradCap className="h-5 w-5" /> View Courses
              </a>
              <a href="#login" onClick={() => f.setMode("login")} className="block rounded-lg border px-4 py-2.5 text-center text-[0.95rem] font-medium" style={{ borderColor: NAVY, color: NAVY }}>
                Login
              </a>
              <button type="button" onClick={() => f.setMode("signup")} className="block w-full rounded-lg px-4 py-2.5 text-center text-[0.95rem] font-medium text-white" style={{ background: TEAL }}>
                Sign Up
              </button>
            </div>

            <form id="login" onSubmit={f.handleSubmit} className="mt-5">
              <h2 className="text-[1.05rem] font-semibold" style={{ color: NAVY }}>
                {f.mode === "signup" ? "Create your account" : "Login"}
              </h2>
              <div className="mt-4 space-y-4">
                {f.mode === "signup" && (
                  <div>
                    <label htmlFor="hv2-name" className="text-[0.82rem] text-[#4a5563]">Full Name</label>
                    <input id="hv2-name" type="text" autoComplete="name" required value={f.name} onChange={(e) => f.setName(e.target.value)}
                      className="mt-1 w-full border-0 border-b border-[#9aa5ad] bg-transparent px-0 py-1.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none focus:ring-0" />
                  </div>
                )}
                <div>
                  <label htmlFor="hv2-email" className="text-[0.82rem] text-[#4a5563]">Email Address</label>
                  <input id="hv2-email" type="email" autoComplete="email" required value={f.email} onChange={(e) => f.setEmail(e.target.value)}
                    className="mt-1 w-full border-0 border-b border-[#9aa5ad] bg-transparent px-0 py-1.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none focus:ring-0" />
                </div>
                <div>
                  <label htmlFor="hv2-password" className="text-[0.82rem] text-[#4a5563]">Password</label>
                  <input id="hv2-password" type="password" autoComplete={f.mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={f.password} onChange={(e) => f.setPassword(e.target.value)}
                    className="mt-1 w-full border-0 border-b border-[#9aa5ad] bg-transparent px-0 py-1.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none focus:ring-0" />
                </div>
              </div>
              <button type="submit" disabled={f.loading} className="mt-5 w-full rounded-lg px-4 py-2.5 text-[0.95rem] font-medium text-white disabled:opacity-60" style={{ background: NAVY }}>
                {f.loading ? "Please wait…" : f.mode === "signup" ? "Create Account" : "Sign In"}
              </button>
              <p className="mt-3 text-right text-[0.82rem] text-[#4a5563]">
                <Link href="/admin/login" className="hover:underline">Forgot Password?</Link>
              </p>
              <p className="mt-4 text-center text-[0.85rem] text-[#4a5563]">
                {f.mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                <button type="button" onClick={f.toggleMode} className="font-medium hover:underline" style={{ color: NAVY }}>
                  {f.mode === "signup" ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </form>
          </div>
        </aside>
      </section>

      <section id="courses" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: NAVY }}>Our Courses</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scrollCourses(-1)} aria-label="Previous courses" disabled={edges.start} className={navBtn}>
                  <IconArrowLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => scrollCourses(1)} aria-label="Next courses" disabled={edges.end} className={navBtn}>
                  <IconChevron className="h-4 w-4" />
                </button>
              </div>
              <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium whitespace-nowrap sm:text-[1.02rem]" style={{ color: GREEN }}>
                View All <IconChevron className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <div ref={scroller} onScroll={trackEdges} className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {courses.map(({ title, copy, level, icon: Icon, color }) => (
                <article key={title} className="flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#e6e2d8] bg-[#fdfcf9] shadow-[0_10px_24px_-16px_rgba(18,48,91,0.45)]">
                  <div className="mx-2 mt-2 flex h-[100px] shrink-0 items-center justify-center rounded-lg" style={{ background: color }}>
                    <Icon className="h-9 w-9 text-white" />
                  </div>
                  <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                    <h3 className="font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
                    <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                    <p className="mt-4 text-[0.82rem] font-medium" style={{ color: level === "Beginner" ? GREEN : TEAL }}>{level}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why-us" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 py-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[2rem] font-bold" style={{ color: NAVY }}>Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold" style={{ color: "#2c3644" }}>Built for learners, not for completion rates</h3>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              EdVentureHub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              So we built something different. Every course is broken into short, focused lessons
              with something to do at the end of each one — a quiz, a project, a checkpoint. You
              move at your own pace, and your dashboard keeps score so progress is visible instead
              of imaginary.
            </p>
            <ul className="mt-8 space-y-6">
              {benefits.map(({ text, icon: Icon }) => (
                <li key={text} className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0" style={{ color: GREEN }}><Icon className="h-9 w-9" /></span>
                  <span className="max-w-[32rem] text-[0.98rem] leading-relaxed text-[#46505e]">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#e6e2d8] bg-[#fdfcf9]/95 p-5 shadow-[0_16px_36px_-20px_rgba(18,48,91,0.4)] sm:p-7">
              <ul className="divide-y divide-[#e6e2d8]">
                {contactRows.map(({ icon: Icon, title, lines }) => (
                  <li key={title} className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4 sm:py-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14" style={{ background: SAGE, color: GREEN }}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.92rem] font-semibold sm:text-[0.95rem]" style={{ color: "#1f2a37" }}>{title}</p>
                      <div className="mt-1 space-y-0.5 text-[0.88rem] leading-relaxed break-words text-[#3f4a58] sm:text-[0.92rem]">
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

      <LandingFooter />
    </div>
  );
}
