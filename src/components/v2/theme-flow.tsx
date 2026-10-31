"use client";

/*
 * New-theme flow guard.
 *
 * Old pages (admin screens, dashboard, about, …) are reused verbatim in the
 * new theme, so their anchors still point at the legacy routes. Capturing the
 * click before Next's Link handler keeps every navigation inside the tree the
 * visitor entered from: legacy paths are remapped onto /homev2, /coursesv2 and
 * /adminv2. In the old tree this component is never mounted.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { remapPath } from "@/lib/theme-path";

export default function ThemeFlow() {
  const router = useRouter();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      const next = remapPath(url.pathname);
      if (next === url.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      router.push(`${next}${url.search}${url.hash}`);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
