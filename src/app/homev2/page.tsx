"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";

/*
 * Standalone landing page — own header/footer on the crumpled-paper ground
 * (AdminLayoutGuard skips the app chrome for this route). All auth goes
 * through the existing AuthProvider; nothing new is stored here.
 *
 * Grid: one 1200px well everywhere (`mx-auto max-w-[1200px] px-6 lg:px-8`), so
 * the logo, every section heading and every card edge share one left axis.
 * The five course cards size from the track (`basis` + `grow-0`), not from a
 * fixed 240px, so they stay flush at every width instead of clipping.
 */

const NAVY = "#12305b";
const GREEN = "#3d6b35";
const TEAL = "#0f5c66";
const SLATE = "#5c6b7a";
const SAGE = "#e7ecdd";

/* ---------- line icons (lucide-style: 24 box, 1.75 stroke, round caps) ---------- */

type IconProps = { className?: string };

const Svg = ({ children, className }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className ?? "h-6 w-6"}
  >
    {children}
  </svg>
);

const BookLogo = ({ className }: IconProps) => (
  <Svg className={className ?? "h-9 w-9"}>
    <path d="M12 6.5C10.2 5.2 7.8 4.6 4.5 4.7v13c3.3-.1 5.7.5 7.5 1.8 1.8-1.3 4.2-1.9 7.5-1.8v-13c-3.3-.1-5.7.5-7.5 1.8Z" />
    <path d="M12 6.5v13" />
    <path d="m12 2.5.9 1.9 2.1.3-1.5 1.5.4 2.1-1.9-1-1.9 1 .4-2.1L9 4.7l2.1-.3.9-1.9Z" />
  </Svg>
);

const IconCode = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
  </Svg>
);
const IconPalette = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-1.4-1.1-1.8-1.1-2.9 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 5.6 17 3 12 3Z" />
    <circle cx="7.5" cy="10.5" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="14" cy="7" r="1" />
  </Svg>
);
const IconDatabase = ({ className }: IconProps) => (
  <Svg className={className}>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
    <path d="M5 5.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
    <path d="M5 11.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
  </Svg>
);
const IconMegaphone = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1Z" />
    <path d="M14 8.5a4 4 0 0 1 0 7M17 6a8 8 0 0 1 0 12" />
  </Svg>
);
const IconBars = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M6 20V13M12 20V8M18 20V4" />
  </Svg>
);
const IconClockBook = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="10" cy="10" r="6" />
    <path d="M10 6.5V10l2.5 1.5" />
    <path d="M5 18.5c2.7-1 5.3-1 8 0v3c-2.7-1-5.3-1-8 0v-3ZM19 21v-3.5" />
  </Svg>
);
const IconGradCap = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m2 9 10-4 10 4-10 4L2 9Z" />
    <path d="M6 11v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" />
    <path d="M22 9v5" />
  </Svg>
);
const IconBooks = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 4h4v16H4zM10 4h4v16h-4z" />
    <path d="M16 5.5 19.5 4l2.5 15-3.5 1.5L16 5.5Z" />
  </Svg>
);
const IconPin = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);
const IconPhone = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M22 16.9v2.6a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 3.8 2 2 0 0 1 4.1 1.6h2.6a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.8 9.3a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </Svg>
);
const IconMail = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);
const IconGlobe = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </Svg>
);
const IconChevron = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
);
const IconArrowLeft = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m14 5-7 7 7 7" />
  </Svg>
);

/* ------------------------------------ data ----------------------------------- */

const courses = [
  { title: "Web Development", copy: "Build modern websites from scratch.", level: "Beginner", icon: IconCode, color: NAVY },
  { title: "UI/UX Design", copy: "Design beautiful and usable interfaces.", level: "Beginner", icon: IconPalette, color: GREEN },
  { title: "Data Science", copy: "Analyze data and build real-world models.", level: "Intermediate", icon: IconDatabase, color: TEAL },
  { title: "Digital Marketing", copy: "Learn strategies to grow brands online.", level: "Beginner", icon: IconMegaphone, color: GREEN },
  { title: "Business Analytics", copy: "Make data-driven business decisions.", level: "Intermediate", icon: IconBars, color: SLATE },
];

const benefits = [
  { text: "Self-paced learning that fits around a full-time schedule", icon: IconClockBook },
  { text: "Curated paths from first lesson to job-ready skills", icon: IconGradCap },
  { text: "A growing library across design, tech, and business", icon: IconBooks },
];

const contactRows = [
  {
    icon: IconPin,
    title: "Our Address",
    lines: ["EdVentureHub Pvt. Ltd.", "123 Learning Lane", "Knowledge Park", "Bangalore, Karnataka 560001", "India"],
  },
  { icon: IconPhone, title: "Contact Us", lines: ["+91 98765 43210", "+91 87654 32109"] },
  { icon: IconMail, title: "Email Us", lines: ["hello@edventurehub.com"] },
  { icon: IconGlobe, title: "Website", lines: ["www.edventurehub.com"] },
];

/* ----------------------------------- page ------------------------------------ */

export default function HomeV2() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      router.push("/dashboard");
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const message =
        code === "auth/email-already-in-use"
          ? "Email already registered"
          : code === "auth/weak-password"
          ? "Password must be at least 6 characters"
          : code === "auth/user-not-found"
          ? "No account found with this email"
          : code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Invalid email or password"
          : code === "auth/invalid-email"
          ? "Please enter a valid email address"
          : code === "auth/too-many-requests"
          ? "Too many attempts. Try again later."
          : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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
    const el = scroller.current;
    if (!el) return;
    const onResize = () => trackEdges();
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navBtn = "flex h-9 w-9 items-center justify-center rounded-full border border-[#d9d4c7] bg-[#fdfcf9] shadow-sm transition-opacity disabled:opacity-40";
  const prevBtn = (
    <button type="button" onClick={() => scrollCourses(-1)} aria-label="Previous courses" disabled={edges.start} className={navBtn}>
      <IconArrowLeft className="h-4 w-4" />
    </button>
  );
  const nextBtn = (
    <button type="button" onClick={() => scrollCourses(1)} aria-label="Next courses" disabled={edges.end} className={navBtn}>
      <IconChevron className="h-4 w-4" />
    </button>
  );

  return (
    <div className="min-h-dvh bg-[url('/crumbled.jpg')] bg-cover bg-center bg-scroll text-[#243040] lg:bg-fixed">
      {/* header */}
      <header className="border-b border-[#d9d4c7]/70">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
          <Link href="/homev2" className="flex shrink-0 items-center gap-3 whitespace-nowrap" aria-label="EdVenture LMS home">
            <BookLogo className="h-10 w-10" />
            <span className="font-serif text-[1.55rem] font-bold tracking-tight" style={{ color: NAVY }}>
              EdVenture <span style={{ color: GREEN }}>LMS</span>
            </span>
          </Link>
          <nav aria-label="Primary">
            <ul className="flex items-center gap-6 text-[1.02rem] sm:gap-10">
              <li>
                <Link href="/homev2" aria-current="page" className="border-b-2 pb-1 font-medium" style={{ borderColor: GREEN }}>
                  Home
                </Link>
              </li>
              <li><a href="#courses" className="hover:opacity-70">Courses</a></li>
              <li><a href="#why-us" className="hover:opacity-70">About Us</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* hero */}
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

          {/* Mobile: the two pieces stack and centre as one composition —
              side by side they don't fit a phone, and left-wrapped they left a
              hole on the right. From `sm` it's the desktop row again. */}
          <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:gap-8">
            <Image
              src="/img.png"
              alt=""
              aria-hidden="true"
              width={400}
              height={328}
              className="h-auto w-[180px] shrink-0 sm:w-[200px]"
            />
            <div className="text-center sm:pb-2 sm:text-left">
              <p className="font-serif text-[1.35rem] text-[#2c3644]">Trusted by</p>
              <div className="mt-3 flex justify-center gap-3 sm:justify-start sm:gap-4">
                {[
                  { letter: "a", bg: NAVY, fg: "#fff" },
                  { letter: "b", bg: "#8c99a3", fg: "#fff" },
                  { letter: "c", bg: SLATE, fg: "#fff" },
                ].map((tile) => (
                  <span
                    key={tile.letter}
                    aria-label={`Trusted partner ${tile.letter}`}
                    className="flex h-12 w-12 items-center justify-center rounded-lg font-serif text-2xl font-bold shadow-sm"
                    style={{ background: tile.bg, color: tile.fg }}
                  >
                    {tile.letter}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* login card */}
        <aside className="lg:col-span-5">
          <div className="mx-auto w-full max-w-[340px] rounded-2xl border border-white/60 bg-white/90 p-6 shadow-[0_18px_40px_-18px_rgba(18,48,91,0.35)] backdrop-blur-sm">
            <div className="space-y-3">
              <a href="#courses" className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[0.95rem] font-medium text-white" style={{ background: GREEN }}>
                <IconGradCap className="h-5 w-5" /> View Courses
              </a>
              <a href="#login" onClick={() => setMode("login")} className="block rounded-lg border px-4 py-2.5 text-center text-[0.95rem] font-medium" style={{ borderColor: NAVY, color: NAVY }}>
                Login
              </a>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="block w-full rounded-lg px-4 py-2.5 text-center text-[0.95rem] font-medium text-white"
                style={{ background: TEAL }}
              >
                Sign Up
              </button>
            </div>

            <form id="login" onSubmit={handleSubmit} className="mt-5">
              <h2 className="text-[1.05rem] font-semibold" style={{ color: NAVY }}>
                {mode === "signup" ? "Create your account" : "Login"}
              </h2>
              <div className="mt-4 space-y-4">
                {mode === "signup" && (
                  <div>
                    <label htmlFor="hv2-name" className="text-[0.82rem] text-[#4a5563]">Full Name</label>
                    <input
                      id="hv2-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full border-0 border-b border-[#9aa5ad] bg-transparent px-0 py-1.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none focus:ring-0"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="hv2-email" className="text-[0.82rem] text-[#4a5563]">Email Address</label>
                  <input
                    id="hv2-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full border-0 border-b border-[#9aa5ad] bg-transparent px-0 py-1.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none focus:ring-0"
                  />
                </div>
                <div>
                  <label htmlFor="hv2-password" className="text-[0.82rem] text-[#4a5563]">Password</label>
                  <input
                    id="hv2-password"
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full border-0 border-b border-[#9aa5ad] bg-transparent px-0 py-1.5 text-[0.95rem] focus:border-[#12305b] focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-lg px-4 py-2.5 text-[0.95rem] font-medium text-white disabled:opacity-60"
                style={{ background: NAVY }}
              >
                {loading
                  ? "Please wait…"
                  : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
              </button>
              <p className="mt-3 text-right text-[0.82rem] text-[#4a5563]">
                <Link href="/admin/login" className="hover:underline">Forgot Password?</Link>
              </p>
              <p className="mt-4 text-center text-[0.85rem] text-[#4a5563]">
                {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                  className="font-medium hover:underline"
                  style={{ color: NAVY }}
                >
                  {mode === "signup" ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </form>
          </div>
        </aside>
      </section>

      {/* courses */}
      <section id="courses" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: NAVY }}>Our Courses</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">{prevBtn}{nextBtn}</div>
              <Link href="/courses" className="flex items-center gap-1 text-[0.95rem] font-medium whitespace-nowrap sm:text-[1.02rem]" style={{ color: GREEN }}>
                View All <IconChevron className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <div
              ref={scroller}
              onScroll={trackEdges}
              className="flex snap-x gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {courses.map(({ title, copy, level, icon: Icon, color }) => (
                <article
                  key={title}
                  className="flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#e6e2d8] bg-[#fdfcf9] shadow-[0_10px_24px_-16px_rgba(18,48,91,0.45)]"
                >
                  <div className="mx-2 mt-2 flex h-[100px] shrink-0 items-center justify-center rounded-lg" style={{ background: color }}>
                    <Icon className="h-9 w-9 text-white" />
                  </div>
                  <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                    <h3 className="font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
                    <p className="mt-2 flex-1 text-[0.86rem] leading-relaxed text-[#4a5563]">{copy}</p>
                    <p className="mt-4 text-[0.82rem] font-medium" style={{ color: level === "Beginner" ? GREEN : TEAL }}>
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
      <section id="why-us" className="border-t border-[#d9d4c7]/70">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-12 px-6 py-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-[2rem] font-bold" style={{ color: NAVY }}>Why Us?</h2>
            <h3 className="mt-6 text-[1.18rem] font-semibold" style={{ color: "#2c3644" }}>
              Built for learners, not for completion rates
            </h3>
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
                  <span className="mt-0.5 shrink-0" style={{ color: GREEN }}>
                    <Icon className="h-9 w-9" />
                  </span>
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
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14"
                      style={{ background: SAGE, color: GREEN }}
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.92rem] font-semibold sm:text-[0.95rem]" style={{ color: "#1f2a37" }}>{title}</p>
                      <div className="mt-1 space-y-0.5 text-[0.88rem] leading-relaxed break-words text-[#3f4a58] sm:text-[0.92rem]">
                        {lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
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
      <footer className="border-t border-[#c9c3b3]">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-3 px-6 py-6 text-[0.95rem] text-[#39434f] sm:flex-row">
          <p>© 2026 EdVentureHub</p>
          <p className="flex items-center gap-3">
            <Link href="/" className="hover:underline">Privacy Policy</Link>
            <span aria-hidden="true" className="h-4 w-px bg-[#9aa5ad]" />
            <Link href="/" className="hover:underline">Terms &amp; Conditions</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
