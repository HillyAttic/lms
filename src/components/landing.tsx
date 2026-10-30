import Link from "next/link";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";

/* Shared chrome for the standalone landing pages (/homev2, /coursesv2) so both
 * sit on the same crumpled-paper theme and one header/footer edit applies to
 * both. */

export const NAVY = "#12305b";
export const GREEN = "#3d6b35";
export const TEAL = "#0f5c66";
export const SLATE = "#5c6b7a";

type IconProps = { className?: string };

const NAV = [
  { key: "home", label: "Home", href: "/homev2" },
  { key: "courses", label: "Courses", href: "/coursesv2" },
  { key: "about", label: "About Us", href: "/homev2#why-us" },
] as const;

export function LandingHeader({ active }: { active: "home" | "courses" }) {
  return (
    <header className="border-b border-[#d9d4c7]/70">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        <Link href="/homev2" className="flex shrink-0 items-center whitespace-nowrap" aria-label="EdVenture LMS home">
          <Image src="/branding_edVenture-5.webp" alt="EdVenture logo" width={200} height={80} unoptimized className="h-16 w-auto" />
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-6 text-[1.02rem] sm:gap-10">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                  className={
                    active === item.key
                      ? "border-b-2 pb-1 font-medium"
                      : "hover:opacity-70"
                  }
                  style={active === item.key ? { borderColor: GREEN } : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
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
  );
}

export function LandingCourseCard({
  title,
  description,
  label,
  color,
  icon: Icon,
  href,
  className,
}: {
  title: string;
  description: string;
  label: string;
  color: string;
  icon: ComponentType<IconProps>;
  href?: string;
  className?: string;
}) {
  const body = (
    <article
      className={
        "flex h-full flex-col overflow-hidden rounded-xl border border-[#e6e2d8] bg-[#fdfcf9] shadow-[0_10px_24px_-16px_rgba(18,48,91,0.45)]" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="mx-2 mt-2 flex h-[100px] shrink-0 items-center justify-center rounded-lg" style={{ background: color }}>
        <Icon className="h-9 w-9 text-white" />
      </div>
      <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
        <h3 className="font-serif text-[1.12rem] font-bold leading-snug" style={{ color: NAVY }}>{title}</h3>
        {/* Three lines reserved on every card so titles and labels line up. */}
        <p className="mt-2 line-clamp-3 min-h-[4.1rem] text-[0.86rem] leading-relaxed text-[#4a5563]">{description}</p>
        <p className="mt-auto pt-4 text-[0.82rem] font-medium" style={{ color: label === "Beginner" ? GREEN : TEAL }}>
          {label}
        </p>
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block h-full transition-transform hover:-translate-y-0.5">
      {body}
    </Link>
  ) : (
    body
  );
}
