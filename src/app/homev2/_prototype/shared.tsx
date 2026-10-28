"use client";

/*
 * PROTOTYPE — shared data, icons and auth for the /homev2 variants.
 * Throwaway; not part of the product.
 */

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/lib/auth-context";

export const NAVY = "#12305b";
export const GREEN = "#3d6b35";
export const TEAL = "#0f5c66";
export const SLATE = "#5c6b7a";
export const SAGE = "#e7ecdd";

type IconProps = { className?: string; style?: React.CSSProperties };

const Svg = ({ children, className, style, w = 1.75 }: IconProps & { children: React.ReactNode; w?: number }) => (
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

export const IconCode = (p: IconProps) => (
  <Svg {...p}><path d="m8 6-6 6 6 6M16 6l6 6-6 6" /></Svg>
);
export const IconPalette = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-1.4-1.1-1.8-1.1-2.9 0-.9.8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 5.6 17 3 12 3Z" />
    <circle cx="7.5" cy="10.5" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="14" cy="7" r="1" />
  </Svg>
);
export const IconDatabase = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
    <path d="M5 5.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
    <path d="M5 11.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
  </Svg>
);
export const IconMegaphone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10v4a1 1 0 0 0 1 1h2l4 4V5L6 9H4a1 1 0 0 0-1 1Z" />
    <path d="M14 8.5a4 4 0 0 1 0 7M17 6a8 8 0 0 1 0 12" />
  </Svg>
);
export const IconBars = (p: IconProps) => (
  <Svg {...p}><path d="M6 20V13M12 20V8M18 20V4" /></Svg>
);
export const IconClockBook = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10" cy="10" r="6" /><path d="M10 6.5V10l2.5 1.5" />
    <path d="M5 18.5c2.7-1 5.3-1 8 0v3c-2.7-1-5.3-1-8 0v-3ZM19 21v-3.5" />
  </Svg>
);
export const IconGradCap = (p: IconProps) => (
  <Svg {...p}>
    <path d="m2 9 10-4 10 4-10 4L2 9Z" />
    <path d="M6 11v5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5" /><path d="M22 9v5" />
  </Svg>
);
export const IconBooks = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4h4v16H4zM10 4h4v16h-4z" /><path d="M16 5.5 19.5 4l2.5 15-3.5 1.5L16 5.5Z" />
  </Svg>
);
export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" />
  </Svg>
);
export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 16.9v2.6a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 3.8 2 2 0 0 1 4.1 1.6h2.6a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L7.8 9.3a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </Svg>
);
export const IconMail = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);
export const IconGlobe = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
  </Svg>
);export const IconChevron = (p: IconProps) => (
  <Svg {...p}><path d="m9 5 7 7-7 7" /></Svg>
);
export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}><path d="m14 5-7 7 7 7" /></Svg>
);

export const courses = [
  { title: "Web Development", copy: "Build modern websites from scratch.", level: "Beginner", icon: IconCode, color: NAVY },
  { title: "UI/UX Design", copy: "Design beautiful and usable interfaces.", level: "Beginner", icon: IconPalette, color: GREEN },
  { title: "Data Science", copy: "Analyze data and build real-world models.", level: "Intermediate", icon: IconDatabase, color: TEAL },
  { title: "Digital Marketing", copy: "Learn strategies to grow brands online.", level: "Beginner", icon: IconMegaphone, color: GREEN },
  { title: "Business Analytics", copy: "Make data-driven business decisions.", level: "Intermediate", icon: IconBars, color: SLATE },
];

export const benefits = [
  { text: "Self-paced learning that fits around a full-time schedule", icon: IconClockBook },
  { text: "Curated paths from first lesson to job-ready skills", icon: IconGradCap },
  { text: "A growing library across design, tech, and business", icon: IconBooks },
];

export const contactRows = [
  { icon: IconPin, title: "Our Address", lines: ["EdVentureHub Pvt. Ltd.", "123 Learning Lane", "Knowledge Park", "Bangalore, Karnataka 560001", "India"] },
  { icon: IconPhone, title: "Contact Us", lines: ["+91 98765 43210", "+91 87654 32109"] },
  { icon: IconMail, title: "Email Us", lines: ["hello@edventurehub.com"] },
  { icon: IconGlobe, title: "Website", lines: ["www.edventurehub.com"] },
];

/* Same auth behaviour as the current page, shared so variants only differ in
 * layout. Variants render their own fields from this state. */
export function useLoginForm() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
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
    mode, setMode, name, setName, email, setEmail, password, setPassword,
    loading, handleSubmit,
    toggleMode: () => setMode(mode === "signup" ? "login" : "signup"),
  };
}

export type LoginForm = ReturnType<typeof useLoginForm>;
