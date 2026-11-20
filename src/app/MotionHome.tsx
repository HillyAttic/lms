"use client";

/*
 * The /homev2 landing page.
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
          <>
            <div>
              <label htmlFor={`${prefix}-name`} className={s.label}>Full name</label>
              <input id={`${prefix}-name`} type="text" autoComplete="name" required
                value={f.name} onChange={(e) => f.setName(e.target.value)} className={s.input} />
            </div>
            <div>
              <label htmlFor={`${prefix}-contact`} className={s.label}>Contact number</label>
              <input id={`${prefix}-contact`} type="tel" autoComplete="tel" required
                value={f.contactNo} onChange={(e) => f.setContactNo(e.target.value)} className={s.input} />
            </div>
            <div>
              <label htmlFor={`${prefix}-organization`} className={s.label}>Organization</label>
              <input id={`${prefix}-organization`} type="text" autoComplete="organization" required
                value={f.organization} onChange={(e) => f.setOrganization(e.target.value)} className={s.input} />
            </div>
            <div>
              <label htmlFor={`${prefix}-designation`} className={s.label}>Designation <span className="text-[#94a3b8]">(optional)</span></label>
              <input id={`${prefix}-designation`} type="text" autoComplete="organization-title"
                value={f.designation} onChange={(e) => f.setDesignation(e.target.value)} className={s.input} />
            </div>
          </>
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
  const s: AuthStyles = {
    title: "font-serif text-[1.35rem] font-semibold text-[#020617]",
    label: "text-[0.82rem] text-[#475569]",
    input: "mt-1 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-[0.95rem] text-[#334155] focus:border-[#6366f1] focus:outline-none",
    submit: "mt-5 w-full rounded-lg bg-[linear-gradient(90deg,#2563eb_0%,#7c3aed_100%)] px-4 py-2.5 text-[0.95rem] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)] transition-transform hover:-translate-y-0.5",
    meta: "mt-3 flex items-center justify-between text-[0.82rem] text-[#475569]",
    link: "hover:underline",
    action: "font-medium text-[#4338ca] hover:underline",
  };

  return (
    <div className="min-h-dvh overflow-hidden bg-[#f8fafc] text-[#334155]" style={paper({ tint: "248,250,252", opacity: 0.5, size: "112%", position: "center 30%" })}>
      <LandingHeader active="home" accent="#4338ca" />

      <section className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-12 lg:gap-10">
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-[#2563eb]/15 blur-3xl"
          animate={{ y: [0, -18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#7c3aed]/10 blur-3xl"
          animate={{ y: [0, 16, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* No entrance animation above the fold: the server-rendered HTML must
            be visible immediately, not wait for hydration to fade it in. */}
        <motion.div
          className="relative lg:col-span-7"
          initial={false}
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.span variants={fadeUp} className="inline-block rounded-full border border-[#e2e8f0] bg-white/70 px-4 py-1.5 text-[0.82rem] font-medium text-[#4338ca] backdrop-blur-sm">
            Move at your own pace
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-6 font-serif text-[clamp(2.15rem,9vw,3.9rem)] leading-[1.08] tracking-tight" style={{ color: "#020617" }}>
            Welcome to
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: MOTION_GRADIENT }}>EdVenture LMS</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-[30rem] text-[1.22rem] leading-relaxed text-[#334155]">
            Empowering your organization with personalized, interactive learning and growth.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-12 flex flex-col gap-4">
            <span className="font-serif text-[1.35rem] text-[#334155]">Trusted by</span>
            <div className="flex flex-col gap-3">
              {/* Width and height are pinned: `h-* + w-auto` sizes these flex
                  items from their intrinsic ratio, so they shift when CSS is
                  hot-reloading or the row is under flex pressure (and can
                  shrink at narrow widths). */}
              {[
                {
                  align: "items-center",
                  logos: [
                    { src: "/clients-logo/hdfc.png", alt: "HDFC Bank", w: 914, h: 260, height: 32 },
                    { src: "/clients-logo/Tata_Motors_Logo.png", alt: "Tata Motors", w: 1404, h: 147, height: 22 },
                  ],
                },
                {
                  /* Wordmarks sit at different heights inside these PNGs
                     (Reliance is stacked, JIVA is a flat wordmark), so centre
                     alignment leaves them visually staggered — align on the
                     bottom edge instead. */
                  align: "items-end",
                  logos: [
                    { src: "/clients-logo/tata.png", alt: "Tata", w: 376, h: 331, height: 34 },
                    { src: "/clients-logo/reliance.png", alt: "Reliance Retail", w: 740, h: 369, height: 36 },
                    { src: "/clients-logo/jiva.png", alt: "JIVA", w: 1129, h: 292, height: 18 },
                  ],
                },
              ].map((row, i) => (
                <div key={row.logos[0].alt} className={`flex flex-wrap gap-x-6 gap-y-3 ${row.align}`}>
                  {row.logos.map((logo) => (
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
                  {i === 1 && (
                    <span className="text-[0.95rem] font-medium text-[#475569]">& more...</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <aside id="login" className="relative lg:col-span-5">
          <motion.div
            className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc]/90 p-6 shadow-[0_28px_60px_-28px_rgba(2,6,23,0.45)] backdrop-blur-md sm:p-7"
            initial={false}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <AuthForm f={f} prefix="mot" s={s} />
          </motion.div>
        </aside>
      </section>

      <section id="courses">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-[1.6rem] font-bold sm:text-[2rem]" style={{ color: "#020617" }}>Our Courses</h2>
            <div className="flex items-center gap-4">
              <Link href="/coursesv2" className="flex items-center gap-1 text-[0.95rem] font-medium sm:text-[1.02rem]" style={{ color: "#4338ca" }}>
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
                      href={`/coursesv2/${course.id}`}
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
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-x-12 px-6 py-14 lg:grid-cols-12">
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
