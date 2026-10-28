"use client";

/* PROTOTYPE — switcher: ?variant=A|B|C|D|E|F + floating bottom bar.
 * A is the existing page; B–K are theme variations of the same structure;
 * L–P are separate layouts from Variants.tsx. */

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { VariantA } from "./VariantA";
import { ThemedHome } from "./ThemedHome";
import { THEMES } from "./themes";
import { LAYOUT_VARIANTS } from "./Variants";

const VARIANTS = [
  { key: "A", name: "Current (paper)" },
  ...THEMES.map((t) => ({ key: t.key, name: t.label })),
  ...Object.entries(LAYOUT_VARIANTS).map(([key, v]) => ({ key, name: v.label })),
] as const;

type Key = (typeof VARIANTS)[number]["key"];
const KEYS: string[] = VARIANTS.map((v) => v.key);

function normalize(raw: string | null): Key {
  return (KEYS.includes(raw ?? "") ? raw : "A") as Key;
}

function Switcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = normalize(params.get("variant")?.toUpperCase() ?? null);
  const index = KEYS.indexOf(current);

  const go = (next: number) => {
    const key = KEYS[(next + KEYS.length) % KEYS.length];
    const sp = new URLSearchParams(params.toString());
    sp.set("variant", key);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  const active = VARIANTS[index];

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full bg-[#17181f] p-1.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
        <button type="button" onClick={() => go(index - 1)} aria-label="Previous variant"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-white/15">←</button>
        <span className="max-w-[min(78vw,26rem)] truncate px-3 text-[0.8rem] font-medium tracking-wide">
          {active.key} <span className="text-white/55">({active.name})</span>
        </span>
        <button type="button" onClick={() => go(index + 1)} aria-label="Next variant"
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-white/15">→</button>
      </div>
    </div>
  );
}

function Root() {
  const params = useSearchParams();
  const current = normalize(params.get("variant")?.toUpperCase() ?? null);
  const theme = THEMES.find((t) => t.key === current);
  const layout = LAYOUT_VARIANTS[current];

  return (
    <>
      {current === "A" ? <VariantA />
        : theme ? <ThemedHome theme={theme} />
        : layout ? <layout.Component />
        : null}
      <Switcher />
    </>
  );
}

export default function PrototypeSwitcher() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f1f4f7]" />}>
      <Root />
    </Suspense>
  );
}
