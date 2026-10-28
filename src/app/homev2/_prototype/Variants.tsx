"use client";

/*
 * PROTOTYPE — layouts L–P. Same palette + type scale as Variant A, different
 * structure and component language per variant:
 *   L neumorphic · M material · N shadcn · O motion · P bento
 * Each has the same three sections: hero + auth, courses, why us + address.
 */

import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { LandingFooter, LandingHeader } from "@/components/landing";
import {
  NAVY, GREEN, TEAL, SLATE, SAGE,
  courses, benefits, contactRows, useLoginForm,
  IconGradCap, IconChevron, IconPin,
} from "./shared";
import type { LoginForm } from "./shared";

type AuthStyles = {
  title: string;
  label: string;
  input: string;
  submit: string;
  meta: string;
  link: string;
  action: string;
};

function AuthForm({ f, prefix, s }: { f: LoginForm; prefix: string; s: AuthStyles }) {
  return (
    <form onSubmit={f.handleSubmit} className="text-left">
      <h2 className={s.title}>{f.mode === "signup" ? "Create your account" : "Sign in"}</h2>
      <div className="mt-4 space-y-3.5">
        {f.mode === "signup" && (
          <div>
            <label htmlFor={`${prefix}-name`} className={s.label}>Full name</label>
            <input id={`${prefix}-name`} type="text" autoComplete="name" required
              value={f.name} onChange={(e) => f.setName(e.target.value)} className={s.input} />
          </div>
        )}
        <div>
          <label htmlFor={`${prefix}-email`} className={s.label}>Email address</label>
          <input id={`${prefix}-email`} type="email" autoComplete="email" required
            value={f.email} onChange={(e) => f.setEmail(e.target.value)} className={s.input} />
        </div>
        <div>
          <label htmlFor={`${prefix}-password`} className={s.label}>Password</label>
          <input id={`${prefix}-password`} type="password"
            autoComplete={f.mode === "signup" ? "new-password" : "current-password"}
            required minLength={6} value={f.password} onChange={(e) => f.setPassword(e.target.value)}
            className={s.input} />
        </div>
      </div>
      <button type="submit" disabled={f.loading} className={s.submit}>
        {f.loading ? "Please wait…" : f.mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <div className={s.meta}>
        <Link href="/admin/login" className={s.link}>Forgot password?</Link>
        <button type="button" onClick={f.toggleMode} className={s.action}>
          {f.mode === "signup" ? "Sign in" : "Create account"}
        </button>
      </div>
    </form>
  );
}

function TrustedTiles({ tileClass }: { tileClass: string }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="font-serif text-[1.35rem] text-[#2c3644]">Trusted by</span>
      {[
        { letter: "a", bg: NAVY },
        { letter: "b", bg: "#8c99a3" },
        { letter: "c", bg: SLATE },
      ].map((t) => (
        <span key={t.letter} className={tileClass} style={{ background: t.bg, color: "#fff" }}>
          {t.letter}
        </span>
      ))}
    </div>
  );
}

const levelColor = (level: string) => (level === "Beginner" ? GREEN : TEAL);

/* ───────────────────────────── L · Neumorphic ───────────────────────────── */

function Neumorphic() {
  const f = useLoginForm();
  const soft = "rounded-[26px] bg-[#e7ecdf] shadow-[10px_10px_22px_rgba(18,48,91,0.10),-10px_-10px_22px_rgba(255,255,255,0.88)]";
  const inset = "rounded-2xl bg-[#e7ecdf] shadow-[inset_4px_4px_9px_rgba(18,48,91,0.12),inset_-4px_-4px_9px_#ffffff]";
  const s: AuthStyles = {
    title: "font-serif text-[1.35rem] font-semibold text-[#12305b]",
    label: "text-[0.82rem] text-[#39434f]",
    input: "mt-1 w-full rounded-xl border-0 bg-[#e7ecdf] px-3 py-2.5 text-[0.95rem] text-[#243040] shadow-[inset_3px_3px_7px_rgba(18,48,91,0.13),inset_-3px_-3px_7px_#ffffff] focus:outline-none focus:shadow-[inset_3px_3px_7px_rgba(61,107,53,0.3),inset_-3px_-3px_7px_#ffffff]",
    submit: "mt-5 w-full rounded-xl bg-[#3d6b35] px-4 py-2.5 text-[0.95rem] font-medium text-white shadow-[4px_4px_10px_rgba(18,48,91,0.2),-4px_-4px_10px_rgba(255,255,255,0.8)] transition-shadow hover:shadow-[2px_2px_5px_rgba(18,48,91,0.2),-2px_-2px_5px_rgba(255,255,255,0.8)]",
    meta: "mt-3 flex items-center justify-between text-[0.82rem] text-[#4a5563]",
    link: "hover:underline",
    action: "font-medium text-[#12305b] hover:underline",
  };

  return (
    <div
      className="min-h-dvh bg-cover bg-center text-[#243040]"
      style={{ backgroundImage: "linear-gradient(rgba(231,236,223,0.9), rgba(231,236,223,0.9)), url('/crumbled.jpg')" }}
    >
      <LandingHeader active="home" />

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:order-2 lg:col-span-7">
          <span className={`inline-block px-4 py-1.5 text-[0.82rem] font-medium text-[#3d6b35] ${inset}`}>
            Learning, reimagined
          </span>
          <h1 className="mt-6 font-serif text-[clamp(2.15rem,9vw,3.9rem)] leading-[1.08] tracking-tight" style={{ color: NAVY }}>
            Welcome to
            <br />
            <span style={{ color: GREEN }}>EdVenture LMS</span>
          </h1>
          <p className="mt-6 max-w-[30rem] text-[1.22rem] leading-relaxed text-[#39434f]">
            Empowering your organization with personalized, interactive learning and growth.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#courses" className="rounded-xl px-5 py-3 text-[0.95rem] font-medium text-white shadow-[4px_4px_10px_rgba(18,48,91,0.22),-4px_-4px_10px_rgba(255,255,255,0.75)]" style={{ background: GREEN }}>
              Browse courses
            </a>
            <a href="#login" className={`px-5 py-3 text-[0.95rem] font-medium ${inset}`} style={{ color: NAVY }}>
              Sign in
            </a>
          </div>
          <TrustedTiles tileClass={`flex h-12 w-12 items-center justify-center rounded-2xl font-serif text-2xl font-bold ${inset}`} />
        </div>

        <aside id="login" className="lg:order-1 lg:col-span-5">
          <div className={`p-6 sm:p-7 ${soft}`}>
            <AuthForm f={f} prefix="neu" s={s} />
          </div>
        </aside>
      </section>

      <section id="courses" className="border-t border-[#d3dac8]">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: NAVY }}>Our Courses</h2>
            <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium sm:text-[1.02rem]" style={{ color: GREEN }}>
              View All <IconChevron className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(({ title, copy, level, icon: Icon }) => (
              <article key={title} className={`p-5 ${soft}`}>
                <span className={`flex h-14 w-14 items-center justify-center ${inset}`} style={{ color: GREEN }}>
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
                <p className="mt-2 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                <p className={`mt-4 inline-block px-3 py-1 text-[0.82rem] font-medium ${inset}`} style={{ color: levelColor(level) }}>
                  {level}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="border-t border-[#d3dac8]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[2rem] font-bold" style={{ color: NAVY }}>Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold text-[#2c3644]">Built for learners, not for completion rates</h3>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              EdVentureHub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              So we built something different. Every course is broken into short, focused lessons
              with something to do at the end of each one — a quiz, a project, a checkpoint.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map(({ text, icon: Icon }) => (
                <li key={text} className={`flex items-center gap-4 p-4 ${soft}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${inset}`} style={{ color: GREEN }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[0.98rem] leading-relaxed text-[#46505e]">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <div className={`p-5 sm:p-7 ${soft}`}>
              <h3 className="font-serif text-[1.35rem] font-semibold" style={{ color: NAVY }}>Visit us</h3>
              <ul className="mt-4 space-y-3">
                {contactRows.map(({ icon: Icon, title, lines }) => (
                  <li key={title} className={`p-4 ${inset}`}>
                    <p className="flex items-center gap-2 text-[0.92rem] font-semibold text-[#1f2a37]">
                      <Icon className="h-4 w-4" style={{ color: GREEN }} />
                      {title}
                    </p>
                    <div className="mt-1 text-[0.88rem] leading-relaxed text-[#3f4a58]">
                      {lines.map((line) => <p key={line}>{line}</p>)}
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

/* ────────────────────────────── M · Material ────────────────────────────── */

function Material() {
  const f = useLoginForm();
  const s: AuthStyles = {
    title: "text-[1.05rem] font-semibold text-[#12305b]",
    label: "text-[0.82rem] font-medium text-[#39434f]",
    input: "mt-1 w-full rounded-lg border border-[#c5cabf] bg-white px-3 py-2.5 text-[0.95rem] transition-colors focus:border-[#3d6b35] focus:outline-none focus:ring-2 focus:ring-[#3d6b35]/25",
    submit: "mt-5 w-full rounded-lg bg-[#3d6b35] px-4 py-2.5 text-[0.95rem] font-medium text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-shadow hover:shadow-[0_6px_14px_rgba(0,0,0,0.28)]",
    meta: "mt-3 flex items-center justify-between text-[0.82rem] text-[#4a5563]",
    link: "hover:underline",
    action: "font-medium text-[#12305b] hover:underline",
  };

  return (
    <div
      className="min-h-dvh bg-cover bg-center text-[#243040]"
      style={{ backgroundImage: "linear-gradient(rgba(247,248,244,0.9), rgba(247,248,244,0.9)), url('/crumbled.jpg')" }}
    >
      <header className="sticky top-0 z-40 bg-white shadow-[0_1px_3px_rgba(18,48,91,0.2)]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
          <Link href="/homev2" className="flex shrink-0 items-center gap-2">
            <IconGradCap className="h-9 w-9" style={{ color: NAVY }} />
            <span className="font-serif text-[1.55rem] font-bold tracking-tight" style={{ color: NAVY }}>
              EdVenture <span style={{ color: GREEN }}>LMS</span>
            </span>
          </Link>
          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-8 text-[1.02rem] text-[#39434f]">
              <li><a href="#courses" className="font-medium" style={{ color: GREEN }}>Home</a></li>
              <li><Link href="/coursesv2" className="hover:text-[#12305b]">Courses</Link></li>
              <li><a href="#why-us" className="hover:text-[#12305b]">About Us</a></li>
            </ul>
          </nav>
          <a href="#login" className="rounded-full px-5 py-2 text-[0.95rem] font-medium text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)]" style={{ background: NAVY }}>
            Sign in
          </a>
        </div>
      </header>

      <section className="bg-[#eef1e8]/80">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.14em]" style={{ color: GREEN }}>Learn · Build · Grow</p>
            <h1 className="mt-3 font-serif text-[clamp(2.15rem,9vw,3.9rem)] leading-[1.08] tracking-tight" style={{ color: NAVY }}>
              Welcome to
              <br />
              <span style={{ color: GREEN }}>EdVenture LMS</span>
            </h1>
            <p className="mt-6 max-w-[30rem] text-[1.22rem] leading-relaxed text-[#39434f]">
              Empowering your organization with personalized, interactive learning and growth.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#courses" className="rounded-full px-6 py-3 text-[0.95rem] font-medium text-white shadow-[0_2px_5px_rgba(0,0,0,0.25)] transition-shadow hover:shadow-[0_8px_18px_rgba(0,0,0,0.24)]" style={{ background: GREEN }}>
                Browse courses
              </a>
              <a href="#why-us" className="rounded-full px-6 py-3 text-[0.95rem] font-medium" style={{ color: NAVY }}>
                Why EdVenture?
              </a>
            </div>
            <TrustedTiles tileClass="flex h-12 w-12 items-center justify-center rounded-full font-serif text-2xl font-bold" />
          </div>

          <aside id="login" className="lg:col-span-5">
            <div className="mx-auto w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.12),0_14px_40px_-16px_rgba(18,48,91,0.4)]">
              <AuthForm f={f} prefix="mat" s={s} />
            </div>
          </aside>
        </div>
      </section>

      <section id="courses" className="bg-white/65">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: NAVY }}>Our Courses</h2>
            <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium sm:text-[1.02rem]" style={{ color: GREEN }}>
              View All <IconChevron className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(({ title, copy, level, icon: Icon, color }) => (
              <article key={title} className="overflow-hidden rounded-2xl bg-[#f7f8f4] transition-shadow hover:shadow-[0_2px_4px_rgba(16,24,40,0.1),0_16px_32px_-20px_rgba(18,48,91,0.45)]">
                <div className="flex h-[104px] items-center justify-center" style={{ background: color }}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full px-2.5 py-0.5 text-[0.82rem] font-medium" style={{ background: SAGE, color: levelColor(level) }}>{level}</span>
                    <Link href="/coursesv2" className="text-[0.95rem] font-medium" style={{ color: GREEN }}>Open</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="bg-[#eef1e8]/80">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[2rem] font-bold" style={{ color: NAVY }}>Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold text-[#2c3644]">Built for learners, not for completion rates</h3>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              EdVentureHub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              So we built something different. Every course is broken into short, focused lessons
              with something to do at the end of each one.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map(({ text, icon: Icon }) => (
                <li key={text} className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.08)]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: SAGE, color: GREEN }}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[0.98rem] leading-relaxed text-[#46505e]">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.1),0_14px_36px_-20px_rgba(18,48,91,0.35)]">
              <h3 className="flex items-center gap-2 font-serif text-[1.35rem] font-semibold" style={{ color: NAVY }}>
                <IconPin className="h-5 w-5" style={{ color: GREEN }} /> Our address
              </h3>
              <p className="mt-3 text-[0.88rem] leading-relaxed text-[#3f4a58]">
                {contactRows[0].lines.map((line) => <span key={line} className="block">{line}</span>)}
              </p>
              <ul className="mt-5 divide-y divide-[#e4e8dd]">
                {contactRows.slice(1).map(({ icon: Icon, title, lines }) => (
                  <li key={title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: SAGE, color: GREEN }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[0.92rem] font-semibold text-[#1f2a37]">{title}</p>
                      <div className="text-[0.88rem] leading-relaxed text-[#3f4a58]">
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

      <footer className="text-white" style={{ background: NAVY }}>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-6 text-[0.95rem] sm:flex-row">
          <p>© 2026 EdVentureHub</p>
          <p className="flex items-center gap-3">
            <Link href="/" className="hover:underline">Privacy Policy</Link>
            <span aria-hidden="true" className="h-4 w-px bg-white/30" />
            <Link href="/" className="hover:underline">Terms &amp; Conditions</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────── N · shadcn ─────────────────────────────── */

function Shadcn() {
  const f = useLoginForm();
  const s: AuthStyles = {
    title: "text-[1.05rem] font-semibold leading-none tracking-tight text-[#12305b]",
    label: "text-[0.82rem] font-medium text-[#39434f]",
    input: "mt-1 h-9 w-full rounded-md border border-[#dfe3d8] bg-transparent px-3 text-[0.95rem] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#12305b]/20",
    submit: "mt-5 h-9 w-full rounded-md bg-[#12305b] text-[0.95rem] font-medium text-white transition-colors hover:bg-[#0e2547]",
    meta: "mt-3 flex items-center justify-between text-[0.82rem] text-[#4a5563]",
    link: "underline-offset-4 hover:underline",
    action: "font-medium text-[#12305b] underline-offset-4 hover:underline",
  };

  return (
    <div
      className="min-h-dvh bg-cover bg-center text-[#243040]"
      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.86), rgba(255,255,255,0.86)), url('/crumbled.jpg')" }}
    >
      <header className="sticky top-0 z-30 border-b border-[#e6e2d8] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-4">
          <Link href="/homev2" className="flex shrink-0 items-center gap-2">
            <IconGradCap className="h-8 w-8" style={{ color: NAVY }} />
            <span className="text-[1.55rem] font-bold tracking-tight" style={{ color: NAVY }}>EdVenture</span>
          </Link>
          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-6 text-[0.95rem] text-[#4a5563]">
              <li><a href="#courses" className="font-medium text-[#12305b]">Courses</a></li>
              <li><a href="#why-us" className="hover:text-[#12305b]">About</a></li>
              <li><Link href="/coursesv2" className="hover:text-[#12305b]">Catalog</Link></li>
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#login" className="inline-flex h-9 items-center rounded-md border border-[#dfe3d8] bg-white px-4 text-[0.95rem] font-medium text-[#12305b] shadow-sm hover:bg-[#f7f8f4]">
              Log in
            </a>
            <a href="#login" className="inline-flex h-9 items-center rounded-md bg-[#12305b] px-4 text-[0.95rem] font-medium text-white hover:bg-[#0e2547]">
              Get started
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 py-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <span className="inline-flex items-center rounded-full border border-[#dfe3d8] bg-[#f7f8f4] px-3 py-1 text-[0.82rem] font-medium text-[#39434f]">
            New · Fall cohort open
          </span>
          <h1 className="mt-5 text-[clamp(2.15rem,9vw,3.9rem)] font-semibold leading-[1.08] tracking-tight" style={{ color: NAVY }}>
            Welcome to <span style={{ color: GREEN }}>EdVenture LMS</span>
          </h1>
          <p className="mt-5 max-w-[30rem] text-[1.22rem] leading-relaxed text-[#39434f]">
            Empowering your organization with personalized, interactive learning and growth.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#courses" className="inline-flex h-10 items-center rounded-md bg-[#12305b] px-5 text-[0.95rem] font-medium text-white hover:bg-[#0e2547]">
              Browse courses
            </a>
            <a href="#why-us" className="inline-flex h-10 items-center rounded-md border border-[#dfe3d8] bg-white px-5 text-[0.95rem] font-medium text-[#12305b] shadow-sm hover:bg-[#f7f8f4]">
              Why us
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#e6e2d8] pt-6 text-[0.95rem] text-[#4a5563]">
            <span><strong className="text-[#12305b]">12k+</strong> learners</span>
            <span><strong className="text-[#12305b]">40+</strong> courses</span>
            <span><strong className="text-[#12305b]">4.9</strong> average rating</span>
          </div>
          <TrustedTiles tileClass="flex h-12 w-12 items-center justify-center rounded-md font-serif text-2xl font-bold" />
        </div>

        <aside id="login" className="lg:col-span-5">
          <div className="rounded-xl border border-[#dfe3d8] bg-white p-6 shadow-sm">
            <AuthForm f={f} prefix="shc" s={s} />
            <p className="mt-4 border-t border-[#eef0e9] pt-4 text-center text-[0.82rem] text-[#6b7280]">
              By continuing you agree to our Terms.
            </p>
          </div>
        </aside>
      </section>

      <section id="courses" className="border-t border-[#e6e2d8] bg-[#f7f8f4]/80">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[1.6rem] font-semibold tracking-tight text-[#12305b] sm:text-[2rem]">Our Courses</h2>
              <p className="mt-1 text-[0.95rem] text-[#4a5563]">Short lessons, real projects.</p>
            </div>
            <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium" style={{ color: GREEN }}>
              View all <IconChevron className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(({ title, copy, level, icon: Icon }) => (
              <article key={title} className="flex flex-col rounded-xl border border-[#dfe3d8] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#f1f3ec]" style={{ color: NAVY }}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[1.12rem] font-semibold leading-snug text-[#12305b]">{title}</h3>
                <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[#eef0e9] pt-3">
                  <span className="rounded-full border border-[#dfe3d8] bg-[#f7f8f4] px-2.5 py-0.5 text-[0.82rem] font-medium text-[#39434f]">{level}</span>
                  <Link href="/coursesv2" className="inline-flex h-8 items-center rounded-md px-2 text-[0.95rem] font-medium text-[#12305b] hover:bg-[#f1f3ec]">
                    View
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="border-t border-[#e6e2d8]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="text-[2rem] font-semibold tracking-tight text-[#12305b]">Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold text-[#2c3644]">Built for learners, not for completion rates</h3>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              EdVentureHub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
            <ul className="mt-8 divide-y divide-[#e6e2d8] border-y border-[#e6e2d8]">
              {benefits.map(({ text, icon: Icon }) => (
                <li key={text} className="flex items-center gap-4 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f1f3ec] text-[#12305b]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[0.98rem] leading-relaxed text-[#46505e]">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-[#dfe3d8] bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-[1.18rem] font-semibold text-[#12305b]">Contact</h3>
              <dl className="mt-4 divide-y divide-[#eef0e9]">
                {contactRows.map(({ icon: Icon, title, lines }) => (
                  <div key={title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <dt className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f1f3ec] text-[#12305b]">
                      <Icon className="h-4 w-4" />
                    </dt>
                    <dd>
                      <p className="text-[0.92rem] font-semibold text-[#1f2a37]">{title}</p>
                      <div className="text-[0.88rem] leading-relaxed text-[#3f4a58]">
                        {lines.map((line) => <p key={line}>{line}</p>)}
                      </div>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e6e2d8]">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-6 text-[0.95rem] text-[#6b7280] sm:flex-row">
          <p>© 2026 EdVentureHub</p>
          <p className="flex items-center gap-3">
            <Link href="/" className="hover:text-[#12305b]">Privacy</Link>
            <span aria-hidden="true" className="h-4 w-px bg-[#dfe3d8]" />
            <Link href="/" className="hover:text-[#12305b]">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────── O · Motion ─────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

function Motion() {
  const f = useLoginForm();
  const s: AuthStyles = {
    title: "font-serif text-[1.35rem] font-semibold text-[#12305b]",
    label: "text-[0.82rem] text-[#39434f]",
    input: "mt-1 w-full rounded-xl border border-[#d9d4c7] bg-white/70 px-3 py-2.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none",
    submit: "mt-5 w-full rounded-xl bg-[linear-gradient(90deg,#12305b,#0f5c66)] px-4 py-2.5 text-[0.95rem] font-medium text-white shadow-[0_10px_24px_-12px_rgba(18,48,91,0.8)] transition-transform hover:-translate-y-0.5",
    meta: "mt-3 flex items-center justify-between text-[0.82rem] text-[#4a5563]",
    link: "hover:underline",
    action: "font-medium text-[#12305b] hover:underline",
  };

  return (
    <div className="min-h-dvh overflow-hidden bg-[url('/crumbled.jpg')] bg-cover bg-center text-[#243040]">
      <LandingHeader active="home" />

      <section className="relative mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-12 lg:gap-10">
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-[#3d6b35]/15 blur-3xl"
          animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#12305b]/10 blur-3xl"
          animate={{ y: [0, 16, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="relative lg:col-span-7"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.span variants={fadeUp} className="inline-block rounded-full border border-[#12305b]/15 bg-white/60 px-4 py-1.5 text-[0.82rem] font-medium text-[#3d6b35] backdrop-blur-sm">
            Move at your own pace
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-6 font-serif text-[clamp(2.15rem,9vw,3.9rem)] leading-[1.08] tracking-tight" style={{ color: NAVY }}>
            Welcome to
            <br />
            <span style={{ color: GREEN }}>EdVenture LMS</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-[30rem] text-[1.22rem] leading-relaxed text-[#39434f]">
            Empowering your organization with personalized, interactive learning and growth.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#courses" className="rounded-xl px-5 py-3 text-[0.95rem] font-medium text-white shadow-[0_14px_28px_-14px_rgba(61,107,53,0.9)]" style={{ background: GREEN }}>
              Browse courses
            </a>
            <a href="#why-us" className="rounded-xl border border-[#12305b]/25 bg-white/50 px-5 py-3 text-[0.95rem] font-medium backdrop-blur-sm" style={{ color: NAVY }}>
              Why us
            </a>
          </motion.div>
          <motion.div variants={fadeUp}>
            <TrustedTiles tileClass="flex h-12 w-12 items-center justify-center rounded-xl font-serif text-2xl font-bold shadow-sm" />
          </motion.div>
        </motion.div>

        <aside id="login" className="relative lg:col-span-5">
          <motion.div
            className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_28px_60px_-28px_rgba(18,48,91,0.55)] backdrop-blur-md sm:p-7"
            initial={{ opacity: 0, y: 26, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <AuthForm f={f} prefix="mot" s={s} />
          </motion.div>
        </aside>
      </section>

      <section id="courses" className="border-t border-[#d9d4c7]/70 bg-[#fdfcf9]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: NAVY }}>Our Courses</h2>
            <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium sm:text-[1.02rem]" style={{ color: GREEN }}>
              View All <IconChevron className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(({ title, copy, level, icon: Icon, color }, i) => (
              <motion.article
                key={title}
                className="flex flex-col rounded-2xl border border-[#e6e2d8] bg-[#fdfcf9] p-5 shadow-[0_14px_30px_-22px_rgba(18,48,91,0.6)]"
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <motion.span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                  style={{ background: color }}
                  whileHover={{ rotate: -6, scale: 1.06 }}
                >
                  <Icon className="h-6 w-6" />
                </motion.span>
                <h3 className="mt-4 font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
                <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                <p className="mt-4 text-[0.82rem] font-medium" style={{ color: levelColor(level) }}>{level}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[2rem] font-bold" style={{ color: NAVY }}>Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold text-[#2c3644]">Built for learners, not for completion rates</h3>
            <p className="mt-4 max-w-[36rem] leading-relaxed text-[#46505e]">
              EdVentureHub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
            <motion.ul
              className="mt-8 space-y-4 border-l-2 border-[#3d6b35]/25 pl-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            >
              {benefits.map(({ text, icon: Icon }) => (
                <motion.li key={text} variants={fadeUp} className="relative flex items-start gap-4">
                  <span className="absolute -left-[1.95rem] mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#fdfcf9] text-[#3d6b35] ring-2 ring-[#3d6b35]/35">
                    <span className="h-2 w-2 rounded-full bg-[#3d6b35]" />
                  </span>
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GREEN }} />
                  <span className="text-[0.98rem] leading-relaxed text-[#46505e]">{text}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_50px_-30px_rgba(18,48,91,0.6)] backdrop-blur-md"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="font-serif text-[1.35rem] font-semibold" style={{ color: NAVY }}>Find us</h3>
              <ul className="mt-4 space-y-3">
                {contactRows.map(({ icon: Icon, title, lines }, i) => (
                  <motion.li
                    key={title}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: 14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e7ecdd]" style={{ color: GREEN }}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[0.92rem] font-semibold text-[#1f2a37]">{title}</p>
                      <div className="text-[0.88rem] leading-relaxed text-[#3f4a58]">
                        {lines.map((line) => <p key={line}>{line}</p>)}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

/* ─────────────────────────────── P · Bento ──────────────────────────────── */

function Bento() {
  const f = useLoginForm();
  const tile = "rounded-3xl border border-[#e6e2d8] bg-[#fdfcf9]/95 shadow-[0_16px_36px_-28px_rgba(18,48,91,0.5)]";
  const s: AuthStyles = {
    title: "font-serif text-[1.35rem] font-semibold text-[#12305b]",
    label: "text-[0.82rem] text-[#39434f]",
    input: "mt-1 w-full rounded-xl border border-[#d9d4c7] bg-[#fffefb] px-3 py-2.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none",
    submit: "mt-5 w-full rounded-xl bg-[#12305b] px-4 py-2.5 text-[0.95rem] font-medium text-white transition-transform hover:-translate-y-0.5",
    meta: "mt-3 flex items-center justify-between text-[0.82rem] text-[#4a5563]",
    link: "hover:underline",
    action: "font-medium text-[#12305b] hover:underline",
  };

  return (
    <div className="min-h-dvh bg-[url('/crumbled.jpg')] bg-cover bg-center text-[#243040]">
      <LandingHeader active="home" />

      <section className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className={`p-7 sm:p-9 lg:col-span-7 ${tile}`}>
            <span className="inline-block rounded-full border border-[#12305b]/15 px-3 py-1 text-[0.82rem] font-medium" style={{ color: GREEN }}>
              Learning that fits
            </span>
            <h1 className="mt-5 font-serif text-[clamp(2.15rem,9vw,3.9rem)] leading-[1.08] tracking-tight" style={{ color: NAVY }}>
              Welcome to
              <br />
              <span style={{ color: GREEN }}>EdVenture LMS</span>
            </h1>
            <p className="mt-5 max-w-[32rem] text-[1.22rem] leading-relaxed text-[#39434f]">
              Empowering your organization with personalized, interactive learning and growth.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#courses" className="rounded-xl px-5 py-3 text-[0.95rem] font-medium text-white" style={{ background: GREEN }}>
                Browse courses
              </a>
              <a href="#why-us" className="rounded-xl border border-[#12305b]/20 px-5 py-3 text-[0.95rem] font-medium" style={{ color: NAVY }}>
                Why us
              </a>
            </div>
          </div>

          <aside id="login" className={`p-6 sm:p-7 lg:col-span-5 ${tile}`}>
            <AuthForm f={f} prefix="ben" s={s} />
          </aside>

          <div className={`flex flex-col justify-between p-6 sm:flex-row sm:items-center lg:col-span-4 ${tile}`}>
            <div>
              <p className="font-serif text-[1.35rem] text-[#2c3644]">Trusted by</p>
              <div className="mt-3 flex gap-3">
                {[
                  { letter: "a", bg: NAVY },
                  { letter: "b", bg: "#8c99a3" },
                  { letter: "c", bg: SLATE },
                ].map((t) => (
                  <span key={t.letter} className="flex h-12 w-12 items-center justify-center rounded-xl font-serif text-2xl font-bold text-white" style={{ background: t.bg }}>
                    {t.letter}
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-4 text-[0.82rem] text-[#6b7280] sm:mt-0 sm:text-right">Teams of every size</p>
          </div>

          <div className={`p-6 lg:col-span-4 ${tile}`}>
            <p className="font-serif text-[1.35rem] text-[#2c3644]">12k+</p>
            <p className="mt-1 text-[0.82rem] text-[#6b7280]">learners on the platform</p>
            <div className="mt-4 flex gap-1.5">
              {courses.slice(0, 5).map(({ title, color }) => (
                <span key={title} className="h-1.5 flex-1 rounded-full" style={{ background: color }} />
              ))}
            </div>
          </div>

          <div className={`flex items-center justify-center p-4 lg:col-span-4 ${tile}`}>
            <Image src="/img.png" alt="" aria-hidden="true" width={400} height={328} className="h-auto w-[150px]" />
          </div>
        </div>
      </section>

      <section id="courses" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: NAVY }}>Our Courses</h2>
            <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium sm:text-[1.02rem]" style={{ color: GREEN }}>
              View All <IconChevron className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(({ title, copy, level, icon: Icon, color }, i) => (
              <article
                key={title}
                className={`flex flex-col p-5 ${tile} ${i === 0 ? "sm:col-span-2" : ""}`}
              >
                <div className={i === 0 ? "flex flex-col gap-5 sm:flex-row sm:items-center" : ""}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: color }}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
                    <p className="mt-2 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-[#e6e2d8] pt-3">
                  <span className="text-[0.82rem] font-medium" style={{ color: levelColor(level) }}>{level}</span>
                  {i === 0 && (
                    <Link href="/coursesv2" className="text-[0.95rem] font-medium" style={{ color: GREEN }}>Start learning →</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className={`p-7 lg:col-span-5 lg:row-span-2 ${tile}`}>
              <h2 className="font-serif text-[2rem] font-bold" style={{ color: NAVY }}>Why Us?</h2>
              <h3 className="mt-4 text-[1.18rem] font-semibold text-[#2c3644]">Built for learners, not for completion rates</h3>
              <p className="mt-4 leading-relaxed text-[#46505e]">
                Most online courses are long on theory and short on the skills people actually need
                at work. Every EdVenture course is broken into short, focused lessons with something
                to do at the end of each one.
              </p>
              <p className="mt-4 leading-relaxed text-[#46505e]">
                You move at your own pace, and your dashboard keeps score so progress is visible
                instead of imaginary.
              </p>
            </div>

            {benefits.map(({ text, icon: Icon }) => (
              <div key={text} className={`flex items-start gap-4 p-6 lg:col-span-7 ${tile}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: SAGE, color: GREEN }}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-[0.98rem] leading-relaxed text-[#46505e]">{text}</p>
              </div>
            ))}

            <div className={`grid gap-4 p-6 sm:grid-cols-2 lg:col-span-12 ${tile}`}>
              {contactRows.map(({ icon: Icon, title, lines }) => (
                <div key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: SAGE, color: GREEN }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[0.92rem] font-semibold text-[#1f2a37]">{title}</p>
                    <div className="text-[0.88rem] leading-relaxed text-[#3f4a58]">
                      {lines.map((line) => <p key={line}>{line}</p>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

export const LAYOUT_VARIANTS: Record<string, { label: string; Component: ComponentType }> = {
  L: { label: "Soft — neumorphic sage", Component: Neumorphic },
  M: { label: "Material — tonal surfaces", Component: Material },
  N: { label: "shadcn — minimal borders", Component: Shadcn },
  O: { label: "Motion — paper, animated", Component: Motion },
  P: { label: "Bento — asymmetric tiles", Component: Bento },
};
