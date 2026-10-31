"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LandingNavLink } from "./landing-nav-link";
import { useAuth } from "@/lib/auth-context";
import { canAccessAdminPanel } from "@/lib/roles";

/*
 * New-theme header, split out from landing.tsx so that module can stay a
 * Server Component — LandingCourseCard passes icon components to a server
 * module and those can't cross into a client boundary.
 */

const DEFAULT_ACCENT = "#3d6b35";

export type LandingSection = "home" | "courses" | "why-us";

const NAV = [
  { key: "home", label: "Home", href: "/homev2" },
  { key: "courses", label: "Courses", href: "/homev2#courses" },
  { key: "why-us", label: "Why Us", href: "/homev2#why-us" },
] as const satisfies readonly { key: LandingSection; label: string; href: string }[];

/** Which nav item owns the current URL, when the caller doesn't say. */
function sectionFor(pathname: string): LandingSection {
  if (pathname.startsWith("/coursesv2")) return "courses";
  return "home";
}

export function LandingHeader({
  active,
  accent = DEFAULT_ACCENT,
}: {
  active?: LandingSection;
  accent?: string;
}) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const current = active ?? sectionFor(pathname);

  return (
    <header className="border-b border-[#d9d4c7]/70">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
        <Link href="/homev2" className="flex shrink-0 items-center whitespace-nowrap" aria-label="EdVenture LMS home">
          <Image src="/branding_edVenture-5.webp" alt="EdVenture logo" width={200} height={80} unoptimized className="h-16 w-auto" />
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3">
          <nav aria-label="Primary">
            <ul className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[0.95rem] sm:gap-x-8 sm:text-[1.02rem]">
              {NAV.map((item) => (
                <li key={item.key}>
                  <LandingNavLink
                    href={item.href}
                    ariaCurrent={current === item.key ? "page" : undefined}
                    className={
                      current === item.key
                        ? "border-b-2 pb-1 font-medium"
                        : "hover:opacity-70"
                    }
                    style={current === item.key ? { borderColor: accent } : undefined}
                  >
                    {item.label}
                  </LandingNavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            {canAccessAdminPanel(role) && (
              <Link
                href="/adminv2"
                className="rounded-full border border-[#e2e8f0] bg-white/70 px-4 py-2 text-[0.9rem] font-medium text-[#4338ca] backdrop-blur-sm transition-colors hover:bg-white"
              >
                Admin
              </Link>
            )}
            {user && (
              <Link
                href="/homev2/dashboard"
                className="rounded-full px-4 py-2 text-[0.9rem] font-medium text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)] transition-transform hover:-translate-y-0.5"
                style={{ backgroundImage: "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)" }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
