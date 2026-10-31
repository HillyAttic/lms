"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

/* Nav link that smooth-scrolls to an in-page section when the target lives on
 * the current page (keeps the ?variant= query intact), and navigates normally
 * otherwise. */
export function LandingNavLink({
  href, className, style, ariaCurrent, children,
}: {
  href: string;
  className: string;
  style?: CSSProperties;
  ariaCurrent?: "page";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [target, hash] = href.split("#");

  return (
    <Link
      href={href}
      aria-current={ariaCurrent}
      className={className}
      style={style}
      onClick={(e) => {
        if (!hash || pathname !== target) return;
        const el = document.getElementById(hash);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
