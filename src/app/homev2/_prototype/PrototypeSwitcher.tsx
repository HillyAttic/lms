"use client";

/* PROTOTYPE — switcher: ?variant=A|B|C|D|E|F + floating bottom bar.
 * A is the existing page; B–K are theme variations of the same structure;
 * L–P are separate layouts from Variants.tsx. */

import dynamic from "next/dynamic";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VariantA } from "./VariantA";
import { ThemedHome } from "./ThemedHome";
import { THEMES } from "./themes";

/* L–P pull in framer-motion and five layouts. Load that chunk only when one of
 * them is selected so every other variant ships a much smaller bundle. */
const LayoutHome = dynamic(() => import("./Variants").then((m) => m.LayoutHome));

const LAYOUTS = [
  { key: "L", name: "Soft — neumorphic sage" },
  { key: "M", name: "Material — tonal surfaces" },
  { key: "N", name: "shadcn — minimal borders" },
  { key: "O", name: "Motion — paper, animated" },
  { key: "P", name: "Bento — asymmetric tiles" },
] as const;

const VARIANTS = [
  { key: "A", name: "Current (paper)" },
  ...THEMES.map((t) => ({ key: t.key, name: t.label })),
  ...LAYOUTS,
] as const;

type Key = (typeof VARIANTS)[number]["key"];
const KEYS: string[] = VARIANTS.map((v) => v.key);

function normalize(raw: string | null): Key {
  return (KEYS.includes(raw ?? "") ? raw : "O") as Key;
}

function Switcher({ current }: { current: Key }) {
  const router = useRouter();
  const index = KEYS.indexOf(current);

  const go = useCallback((next: number) => {
    const key = KEYS[(next + KEYS.length) % KEYS.length];
    router.replace(`/homev2?variant=${key}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

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

export default function PrototypeSwitcher({ variant }: { variant?: string }) {
  const current = normalize(variant?.toUpperCase() ?? null);
  const theme = THEMES.find((t) => t.key === current);
  const isLayout = LAYOUTS.some((l) => l.key === current);

  return (
    <>
      {current === "A" ? <VariantA />
        : theme ? <ThemedHome theme={theme} />
        : isLayout ? <LayoutHome variant={current} />
        : null}
      <Switcher current={current} />
    </>
  );
}
