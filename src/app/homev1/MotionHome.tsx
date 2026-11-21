"use client";

/*
 * The site's landing page.
 *
 * Blue→violet accent, staggered motion. Hero + auth, why us + contact. Auth
 * behaviour is shared with the sign-in dialog via useLoginForm below.
 */

import Link from "next/link";
import Image from "next/image";
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { LandingFooter, LandingHeader } from "@/components/landing";
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
      router.push("/dashboard");
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

/* Accent from the dashboard nav: royal blue → violet, left to right. */
const MOTION_GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";

/* Width/height are pinned so the intrinsic ratio doesn't shift under flex
   pressure; heights follow the wordmarks' own scale. */
const CLIENT_LOGOS = [
  { src: "/clients-logo/hdfc.png", alt: "HDFC Bank", w: 914, h: 260, height: 32 },
  { src: "/clients-logo/Tata_Motors_Logo.png", alt: "Tata Motors", w: 1404, h: 147, height: 22 },
  { src: "/clients-logo/tata.png", alt: "Tata", w: 376, h: 331, height: 34 },
  { src: "/clients-logo/reliance.png", alt: "Reliance Retail", w: 740, h: 369, height: 36 },
  { src: "/clients-logo/jiva.png", alt: "JIVA", w: 1129, h: 292, height: 18 },
  { src: "/clients-logo/srm-logo.png", alt: "SRM Institute of Science and Technology", w: 544, h: 184, height: 34 },
];

/* One copy of the loop, repeated so it spans the widest viewport — otherwise
   both copies (and therefore duplicate logos) are visible at once. */
const CLIENT_MARQUEE = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

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

      <div className={`mt-6 grid gap-4 ${f.mode === "signup" ? "sm:grid-cols-2" : ""}`}>
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
        className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl px-4 text-[0.98rem] font-semibold text-white shadow-[0_16px_32px_-16px_rgba(109,40,217,0.85)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        style={{ backgroundImage: MOTION_GRADIENT }}
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

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function MotionHome() {
  const f = useLoginForm();

  return (
    <div className="min-h-dvh overflow-hidden bg-[linear-gradient(155deg,#f7f4ff_0%,#f0eafc_48%,#e8ddf8_100%)] text-[#334155]">
      <LandingHeader active="home" accent="#4338ca" />

      <section className="relative overflow-hidden">
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
            <h1 className="mt-7 font-serif text-[clamp(2.1rem,4.8vw,3.4rem)] leading-[1.05] font-bold tracking-[-0.01em] text-[#0b0b12]">
              Welcome to the{" "}
              <span
                className="block bg-clip-text text-transparent"
                style={{ backgroundImage: MOTION_GRADIENT }}
              >
                EdVenture Learning Portal
              </span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-[1.05rem] leading-relaxed text-[#4b5563]">
              A dedicated portal for immersive, scenario-led training — built to build job-ready
              skills, not just tick completion boxes.
            </p>
          </div>

          <aside id="login" className="relative lg:col-span-5">
            <div className="relative rounded-[26px] bg-white p-8 font-serif shadow-[0_40px_90px_-50px_rgba(76,29,149,0.55)] ring-1 ring-[#efe8fb] sm:p-10">
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
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max animate-[marquee_32s_linear_infinite] items-center gap-x-10 pr-10 hover:[animation-play-state:paused] motion-reduce:animate-none">
              {/* Two copies + trailing gap so the -50% loop is seamless; the
                  second copy is hidden from assistive tech. */}
              {[...CLIENT_MARQUEE, ...CLIENT_MARQUEE].map((logo, i) => (
                <Image
                  key={i}
                  src={logo.src}
                  alt={i < CLIENT_LOGOS.length ? logo.alt : ""}
                  aria-hidden={i >= CLIENT_LOGOS.length}
                  width={logo.w}
                  height={logo.h}
                  className="shrink-0 object-contain"
                  style={{ height: logo.height, width: (logo.height * logo.w) / logo.h }}
                />
              ))}
            </div>
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
