import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";

/* Shared chrome for the standalone landing pages (/homev2, /coursesv2 and the
 * themed subpages) so they sit on the same crumpled-paper theme and one
 * header/footer edit applies to all of them.
 *
 * The header lives in ./landing-header.tsx because it needs client hooks;
 * this module stays a Server Component so cards can receive icon components. */

export { LandingHeader } from "./landing-header";

export const NAVY = "#12305b";
export const GREEN = "#3d6b35";
export const TEAL = "#0f5c66";
export const SLATE = "#5c6b7a";

type IconProps = { className?: string };

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
  image,
  href,
  className,
}: {
  title: string;
  description: string;
  label: string;
  color: string;
  icon: ComponentType<IconProps>;
  image?: string | null;
  href?: string;
  className?: string;
}) {
  const body = (
    <article
      className={
        "flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)]" +
        (className ? ` ${className}` : "")
      }
    >
      <div className="relative mx-2 mt-2 h-[100px] shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]">
        {image ? (
          // Signed GCS URLs are long; the optimizer resizes them to the painted
          // size and caches by URL, so repeat views don't re-download the original.
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon className="h-9 w-9 text-white" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
        <h3 className="font-serif text-[1.12rem] font-bold leading-snug text-[#020617]">{title}</h3>
        {/* Three lines reserved on every card so titles and labels line up. */}
        <p className="mt-2 line-clamp-3 min-h-[4.1rem] text-[0.86rem] leading-relaxed text-[#475569]">{description}</p>
        <p className="mt-auto pt-4 text-[0.82rem] font-medium" style={{ color }}>
          {label}
        </p>
      </div>
    </article>
  );

  return href ? (
    <Link href={href} className="block h-full transition-transform duration-200 hover:-translate-y-1">
      {body}
    </Link>
  ) : (
    body
  );
}
