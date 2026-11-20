"use client";

/*
 * The site's landing page.
 *
 * Paper texture, blue→violet accent, staggered motion. Hero + auth, courses,
 * why us + contact. Auth behaviour is shared with the sign-in dialog via
 * useLoginForm below.
 */

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LandingFooter, LandingHeader } from "@/components/landing";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";
import { useAuth } from "@/lib/auth-context";

type IconProps = { className?: string; style?: CSSProperties };

const Svg = ({ children, className, style, w = 1.75 }: IconProps & { children: ReactNode; w?: number }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className ?? "h-6 w-6"}
    style={style}
  >
    {children}
  </svg>
);

const IconClockBook = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
);
const IconGradCap = (p: IconProps) => (
  <Svg {...p}>
    <path d="m2 9 10-4 10 4-10 4L2 9Z" />
    <path d="M6 11v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" /><path d="M22 9v5" />
  </Svg>
);
const IconBooks = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="M16 5.5 19.5 4l2.5 15-3.5 1.5L16 5.5Z" />
  </Svg>
);
const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
  </Svg>
);
const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 16.9v2.6a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 3.8 2 2 0 0 1 4.1 1.6h2.6a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.8 9.3a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </Svg>
);
const IconMail = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);
const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </Svg>
);
const IconChevron = (p: IconProps) => (
  <Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>
);
const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}><path d="m14 5-7 7 7 7" /></Svg>
);
const IconArrowRight = (p: IconProps) => (
  <Svg {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Svg>
);
const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);
const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7 2.7v5.6c0 4.3-2.9 7.9-7 9.7-4.1-1.8-7-5.4-7-9.7V5.7L12 3Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" />
  </Svg>
);

const benefits = [
  { text: "Self-paced learning that fits around a full-time schedule", icon: IconClockBook },
  { text: "Curated paths from first lesson to job-ready skills", icon: IconGradCap },
  { text: "A growing library across design, tech, and business", icon: IconBooks },
];

const contactRows = [
  { icon: IconPin, title: "Our Address", lines: ["EdVenture Hub Pvt. Ltd.", "123 Learning Lane", "Knowledge Park", "Bangalore, Karnataka 560001", "India"] },
  { icon: IconPhone, title: "Contact Us", lines: ["9582232050", "9999457847"] },
  { icon: IconMail, title: "Email Us", lines: ["admin@edventurehub.com"] },
  { icon: IconGlobe, title: "Website", lines: ["www.edventurehub.com"] },
];

/* Same auth behaviour as the previous landing page. The form only renders the
 * fields; state lives here so the layout stays presentational. */
function useLoginForm() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [organization, setOrganization] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          toast.error("Please enter your name");
          return;
        }
        if (!contactNo.trim() || !organization.trim()) {
          toast.error("Please enter contact number and organization");
          return;
        }
        await signUpWithEmail(email, password, name, {
          contactNo: contactNo.trim(),
          organization: organization.trim(),
          designation: designation.trim() || undefined,
        });
        toast.success("Account created successfully!");
      } else {
        await signInWithEmail(email, password);
        toast.success("Login successful!");
      }
      router.push("/leaderboard");
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const message =
        code === "auth/email-already-in-use" ? "Email already registered"
        : code === "auth/weak-password" ? "Password must be at least 6 characters"
        : code === "auth/user-not-found" ? "No account found with this email"
        : code === "auth/wrong-password" || code === "auth/invalid-credential" ? "Invalid email or password"
        : code === "auth/invalid-email" ? "Please enter a valid email address"
        : code === "auth/too-many-requests" ? "Too many attempts. Try again later."
        : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode, setMode, name, setName,
    contactNo, setContactNo, organization, setOrganization,
    designation, setDesignation,
    email, setEmail, password, setPassword,
    loading, handleSubmit,
    toggleMode: () => setMode(mode === "signup" ? "login" : "signup"),
  };
}

type LoginForm = ReturnType<typeof useLoginForm>;

const LABEL = "block text-[0.72rem] font-bold tracking-[0.1em] text-[#475569] uppercase";
const INPUT =
  "mt-2 h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-3.5 text-[0.95rem] text-[#0f172a] placeholder:text-[#9aa4b2] focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/15";
const ICON_INPUT = `${INPUT} pl-11`;

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute bottom-0 left-3.5 flex h-12 items-center text-[#94a3b8]">
      {children}
    </span>
  );
}

function AuthForm({ f, prefix }: { f: LoginForm; prefix: string }) {
  return (
    <form onSubmit={f.handleSubmit} className="text-left">
      <h2 className="text-[1.65rem] font-bold tracking-tight text-[#0b0b12]">
        {f.mode === "signup" ? "Create account" : "Sign in"}
      </h2>
      <p className="mt-1.5 pr-14 text-[0.88rem] leading-relaxed text-[#64748b]">
        {f.mode === "signup"
          ? "Set up access to your assigned learning tracks"
          : "Access your assigned company learning tracks"}
      </p>

      <div className="mt-6 space-y-4">
        {f.mode === "signup" && (
          <>
            <div>
              <label htmlFor={`${prefix}-name`} className={LABEL}>Full name</label>
              <input id={`${prefix}-name`} type="text" autoComplete="name" required
                value={f.name} onChange={(e) => f.setName(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor={`${prefix}-contact`} className={LABEL}>Contact number</label>
              <input id={`${prefix}-contact`} type="tel" autoComplete="tel" required
                value={f.contactNo} onChange={(e) => f.setContactNo(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor={`${prefix}-organization`} className={LABEL}>Organization</label>
              <input id={`${prefix}-organization`} type="text" autoComplete="organization" required
                value={f.organization} onChange={(e) => f.setOrganization(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor={`${prefix}-designation`} className={LABEL}>Designation <span className="font-medium normal-case tracking-normal text-[#94a3b8]">(optional)</span></label>
              <input id={`${prefix}-designation`} type="text" autoComplete="organization-title"
                value={f.designation} onChange={(e) => f.setDesignation(e.target.value)} className={INPUT} />
            </div>
          </>
        )}
        <div>
          <label htmlFor={`${prefix}-email`} className={LABEL}>Email address</label>
          <div className="relative">
            <input id={`${prefix}-email`} type="email" autoComplete="email" required
              placeholder="name@company.com"
              value={f.email} onChange={(e) => f.setEmail(e.target.value)} className={ICON_INPUT} />
            <FieldIcon><IconMail className="h-[18px] w-[18px]" /></FieldIcon>
          </div>
        </div>
        <div>
          <label htmlFor={`${prefix}-password`} className={LABEL}>Password</label>
          <div className="relative">
            <input id={`${prefix}-password`} type="password"
              autoComplete={f.mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••••"
              required minLength={6} value={f.password} onChange={(e) => f.setPassword(e.target.value)}
              className={ICON_INPUT} />
            <FieldIcon><IconLock className="h-[18px] w-[18px]" /></FieldIcon>
          </div>
        </div>
      </div>

      {f.mode === "login" && (
        <div className="mt-3 text-right">
          <Link href="/admin/login" className="text-[0.84rem] font-semibold text-[#6d28d9] hover:underline">
            Forgot password?
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={f.loading}
        className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#8b5cf6_0%,#6d28d9_100%)] px-4 text-[0.98rem] font-semibold text-white shadow-[0_16px_32px_-16px_rgba(109,40,217,0.85)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {f.loading ? "Please wait…" : f.mode === "signup" ? "Create account" : "Sign in"}
        {!f.loading && <IconArrowRight className="h-[18px] w-[18px]" />}
      </button>

      <p className="mt-5 text-center text-[0.86rem] text-[#64748b]">
        {f.mode === "signup" ? "Already have an account?" : "New to the portal?"}{" "}
        <button type="button" onClick={f.toggleMode} className="font-semibold text-[#6d28d9] hover:underline">
          {f.mode === "signup" ? "Sign in" : "Create account"}
        </button>
      </p>
    </form>
  );
}

/* Crumpled-paper wash: tint, texture scale and crop anchor. */
function paper({
  tint, opacity = 0.88, angle = 180, size = "cover", position = "center",
}: { tint?: string; opacity?: number; angle?: number; size?: string; position?: string } = {}): CSSProperties {
  const wash = tint
    ? `linear-gradient(${angle}deg, rgba(${tint},${opacity}), rgba(${tint},${opacity}))`
    : null;
  return {
    backgroundImage: [wash, "url('/crumbled.jpg')"].filter(Boolean).join(", "),
    backgroundSize: size,
    backgroundPosition: position,
    backgroundRepeat: "no-repeat",
  } as CSSProperties;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

/* Accent from the dashboard nav: royal blue → violet, left to right. */
const MOTION_GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";
const COURSE_TYPE_LABEL: Record<RepositoryContentItem["type"], string> = {
  scorm: "SCORM",
  video: "Video",
  game: "Game",
};

export default function MotionHome({ courses }: { courses: RepositoryContentItem[] }) {
  const f = useLoginForm();
  const scroller = useRef<HTMLDivElement>(null);

  /* Two identical passes; hop by one copy before scrolling so the arrows loop forever. */
  const scrollCourses = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-course-card]");
    const step = cards[1]
      ? cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left
      : 0;
    if (!step) return;
    const half = (el.firstElementChild as HTMLElement).getBoundingClientRect().width;
    if (dir === 1 && el.scrollLeft >= half) el.scrollLeft -= half;
    if (dir === -1 && el.scrollLeft < step) el.scrollLeft += half;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="min-h-dvh overflow-hidden bg-[#f8fafc] text-[#334155]" style={paper({ tint: "248,250,252", opacity: 0.5, size: "112%", position: "center 30%" })}>
      <LandingHeader active="home" accent="#4338ca" />

      <section className="relative overflow-hidden bg-[linear-gradient(155deg,#f7f4ff_0%,#f0eafc_48%,#e8ddf8_100%)]">
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#8b5cf6]/15 blur-3xl"
          animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#7c3aed]/10 blur-3xl"
          animate={{ y: [0, 16, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto grid w-full max-w-[1500px] grid-cols-1 items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:px-14 lg:py-24">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ddd6fe] bg-white/70 px-4 py-1.5 text-[0.72rem] font-bold tracking-[0.14em] text-[#4c1d95] uppercase backdrop-blur-sm">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#7c3aed]" />
              On-demand capability hub
            </span>
            <h1 className="mt-7 text-[clamp(2.4rem,7.5vw,4.3rem)] leading-[1.03] font-extrabold tracking-[-0.035em] text-[#0b0b12]">
              Welcome to the{" "}
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(90deg,#8b5cf6 0%,#6d28d9 55%,#5b21b6 100%)" }}
              >
                EdVenture Learning Portal
              </span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[1.15rem] leading-relaxed text-[#4b5563]">
              A dedicated portal for immersive, scenario-led training — built to build job-ready
              skills, not just tick completion boxes.
            </p>
          </div>

          <aside id="login" className="relative lg:col-span-5">
            <div className="relative rounded-[26px] bg-white p-8 shadow-[0_40px_90px_-50px_rgba(76,29,149,0.55)] ring-1 ring-[#efe8fb] sm:p-10">
              <span className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#f3efff] text-[#7c3aed]">
                <IconShieldCheck className="h-5 w-5" />
              </span>
              <AuthForm f={f} prefix="mot" />
            </div>
          </aside>
        </div>
      </section>

      <section aria-label="Customers" className="border-y border-[#e5e7eb] bg-white">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center gap-7 px-6 py-14 sm:px-10 lg:px-14">
          <p className="text-[0.78rem] font-semibold tracking-[0.18em] text-[#475569] uppercase">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {/* Width and height are pinned so the intrinsic ratio doesn't shift
                under flex pressure; heights follow the wordmarks' own scale. */}
            {[
              { src: "/clients-logo/hdfc.png", alt: "HDFC Bank", w: 914, h: 260, height: 32 },
              { src: "/clients-logo/Tata_Motors_Logo.png", alt: "Tata Motors", w: 1404, h: 147, height: 22 },
              { src: "/clients-logo/tata.png", alt: "Tata", w: 376, h: 331, height: 34 },
              { src: "/clients-logo/reliance.png", alt: "Reliance Retail", w: 740, h: 369, height: 36 },
              { src: "/clients-logo/jiva.png", alt: "JIVA", w: 1129, h: 292, height: 18 },
            ].map((logo) => (
              <Image
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="shrink-0 object-contain"
                style={{ height: logo.height, width: (logo.height * logo.w) / logo.h }}
              />
            ))}
            <span className="rounded-full bg-[#f1f5f9] px-4 py-2 text-[0.9rem] font-medium text-[#4338ca]">
              + 20+ More Enterprises
            </span>
          </div>
        </div>
      </section>

      <section id="courses">
        <div className="mx-auto w-full max-w-[1500px] px-6 py-16 sm:px-10 lg:px-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: "#020617" }}>Our Courses</h2>
            <div className="flex items-center gap-4">
              <Link href="/courses" className="flex items-center gap-1 text-[0.95rem] font-medium sm:text-[1.02rem]" style={{ color: "#4338ca" }}>
                View All <IconChevron className="h-5 w-5" />
              </Link>
              <div className="flex gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => scrollCourses(-1)}
                  aria-label="Previous courses"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white/80 text-[#4338ca] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <IconArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCourses(1)}
                  aria-label="Next courses"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white/80 text-[#4338ca] shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <IconChevron className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          {/* Two identical passes; JS wraps at the halfway point for a seamless loop. */}
          <div className="mt-8 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-4">
            <button
              type="button"
              onClick={() => scrollCourses(-1)}
              aria-label="Previous courses"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white/90 text-[#4338ca] shadow-[0_10px_24px_-12px_rgba(2,6,23,0.45)] backdrop-blur-sm transition-colors hover:bg-white lg:flex"
            >
              <IconArrowLeft className="h-4 w-4" />
            </button>
            <div
              ref={scroller}
              className="flex snap-x snap-mandatory overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {courses.length === 0 ? (
                <p className="px-1 py-10 text-[0.95rem] text-[#475569]">
                  Courses published from the admin panel will appear here.
                </p>
              ) : [0, 1].map((pass) => (
                <div key={pass} inert={pass === 1} className="flex w-full shrink-0 gap-5 pr-5">
                  {courses.map((course) => (
                    <Link
                      key={`${course.type}-${course.id}`}
                      href={`/courses/${course.id}`}
                      data-course-card=""
                      className="group flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)] transition-transform hover:-translate-y-1.5 sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]"
                    >
                      <div className="relative h-[104px] shrink-0 overflow-hidden bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt=""
                            fill
                            sizes="300px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="line-clamp-2 font-serif text-[1.12rem] font-bold leading-snug" style={{ color: "#020617" }}>{course.name}</h3>
                        <p className="mt-2 line-clamp-2 flex-1 text-[0.86rem] leading-relaxed text-[#475569]">
                          {course.description || course.features || "Open the course to see what it covers."}
                        </p>
                        <p className="mt-4 text-[0.82rem] font-medium" style={{ color: "#4338ca" }}>
                          {COURSE_TYPE_LABEL[course.type]}
                          {course.duration ? <span className="text-[#6b7280]"> · {course.duration} min</span> : null}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollCourses(1)}
              aria-label="Next courses"
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white/90 text-[#4338ca] shadow-[0_10px_24px_-12px_rgba(2,6,23,0.45)] backdrop-blur-sm transition-colors hover:bg-white lg:flex"
            >
              <IconChevron className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section id="why-us">
        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-x-12 px-6 py-16 sm:px-10 lg:grid-cols-12 lg:px-14">
          <div className="lg:col-span-7 lg:row-start-1">
            <h2 className="font-serif text-[2rem] font-bold" style={{ color: "#020617" }}>Why Us?</h2>
            <h3 className="mt-4 text-[1.18rem] font-semibold text-[#020617]">
              <span className="inline rounded-sm px-1.5 py-0.5 text-white box-decoration-clone" style={{ backgroundImage: MOTION_GRADIENT }}>
                Built for learners, not for completion rates
              </span>
            </h3>
            <p className="mt-4 mb-5 max-w-[36rem] leading-relaxed text-[#334155]">
              EdVenture Hub started with a simple frustration: most online courses are long on theory
              and short on the skills people actually need at work.
            </p>
          </div>

          <motion.ul
            className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb] lg:col-span-7 lg:row-start-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: "-60px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
          >
            {benefits.map(({ text, icon: Icon }) => (
              <motion.li
                key={text}
                variants={fadeUp}
                className="flex h-[76px] items-center gap-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundImage: MOTION_GRADIENT }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[0.98rem] leading-relaxed text-[#334155]">{text}</span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="mt-12 flex flex-col rounded-2xl border border-[#e5e7eb] bg-[#f8fafc]/90 shadow-[0_24px_50px_-30px_rgba(2,6,23,0.45)] backdrop-blur-md lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:grid lg:grid-rows-subgrid"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="px-5 pt-5 sm:px-6 sm:pt-6">
              <h3 className="font-serif text-[1.35rem] font-semibold" style={{ color: "#020617" }}>Find us</h3>
              <p className="mt-5 mb-6 text-[0.88rem] leading-relaxed text-[#475569]">
                Questions about a course, a cohort, or a team plan? Use any channel below
                and our team will get back to you within one business day.
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-[#e2e8f0] px-5 pb-5 sm:px-6 sm:pb-6">
              {contactRows.filter((row) => row.title !== "Our Address").reverse().map(({ icon: Icon, title, lines }, i) => (
                <motion.li
                  key={title}
                  className="flex h-[76px] items-center gap-3"
                  initial={{ opacity: 0, x: 14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundImage: MOTION_GRADIENT }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[0.92rem] font-semibold text-[#020617]">{title}</p>
                    <div className="text-[0.88rem] leading-relaxed text-[#475569]">
                      {lines.map((line) => <p key={line}>{line}</p>)}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
