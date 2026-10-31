"use client";

/* PROTOTYPE — two course-grid layouts for /coursesv2, switchable with
 * ?variant=A|B. Throwaway: fold the winner into page.tsx and delete this file.
 * Kept in main only while the choice is open. */

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RepositoryContentItem } from "@/app/actions/repository-actions";

type IconProps = { className?: string };

const Svg = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className ?? "h-6 w-6"}>
    {children}
  </svg>
);
const IconScorm = ({ className }: IconProps) => <Svg className={className}><path d="m8 6-6 6 6 6M16 6l6 6-6 6" /></Svg>;
const IconVideo = ({ className }: IconProps) => <Svg className={className}><rect x="2" y="6" width="13" height="12" rx="2" /><path d="m15 11 7-4v10l-7-4" /></Svg>;
const IconGame = ({ className }: IconProps) => <Svg className={className}><path d="M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z" /><path d="M7 12h4M9 10v4M16 11h.01M18.5 13h.01" /></Svg>;

const TYPE_STYLES: Record<
  RepositoryContentItem["type"],
  { label: string; color: string; icon: React.ComponentType<IconProps> }
> = {
  scorm: { label: "SCORM", color: "#2563eb", icon: IconScorm },
  video: { label: "Video", color: "#7c3aed", icon: IconVideo },
  game: { label: "Game", color: "#4338ca", icon: IconGame },
};

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=320&q=80&auto=format&fit=crop`;
const TYPE_IMAGE: Record<RepositoryContentItem["type"], string> = {
  scorm: photo("1461749280684-dccba630e2f6"),
  video: photo("1531403009284-440f080d1e12"),
  game: photo("1551288049-bebda4e38f71"),
};

const blurb = (c: RepositoryContentItem) =>
  c.description || c.features || "Open the course to see what it covers.";

/* ---------- A: editorial rows — image · copy · metadata, stacked on rules ---------- */

function VariantA({ courses }: { courses: RepositoryContentItem[] }) {
  return (
    <ul className="mt-10 border-y border-[#d9d4c7]/70">
      {courses.map((course) => {
        const style = TYPE_STYLES[course.type];
        return (
          <li key={`${course.type}-${course.id}`} className="border-b border-[#d9d4c7]/70 last:border-b-0">
            <Link
              href={`/coursesv2/${course.id}`}
              className="group grid gap-5 py-6 sm:grid-cols-[200px_1fr_auto] sm:items-center"
            >
              <div className="relative h-[130px] overflow-hidden rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]">
                <Image
                  src={course.thumbnailUrl || TYPE_IMAGE[course.type]}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: style.color }}>
                  <style.icon className="h-4 w-4" />
                  {style.label}
                </p>
                <h3 className="mt-1.5 font-serif text-[1.25rem] font-bold leading-snug text-[#020617]">{course.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-[0.9rem] leading-relaxed text-[#475569]">{blurb(course)}</p>
              </div>
              <div className="flex items-center gap-4 text-[0.85rem] text-[#475569] sm:flex-col sm:items-end sm:gap-1.5">
                {course.duration ? <span>{course.duration} min</span> : null}
                {course.rating ? <span>★ {course.rating.toFixed(1)}</span> : null}
                <span className="ml-auto rounded-full border border-[#d9d4c7] px-4 py-1.5 font-medium text-[#4338ca] transition-colors group-hover:border-[#4338ca] group-hover:bg-[#4338ca] group-hover:text-white sm:ml-0">
                  View
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- B: featured mosaic — one hero tile, full-bleed image tiles after ---------- */

function VariantB({ courses }: { courses: RepositoryContentItem[] }) {
  const [featured, ...rest] = courses;
  if (!featured) return null;
  const featuredStyle = TYPE_STYLES[featured.type];

  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Link
        href={`/coursesv2/${featured.id}`}
        className="group relative col-span-full h-[320px] overflow-hidden rounded-3xl bg-[#0f172a] sm:col-span-2 lg:row-span-2 lg:h-full lg:min-h-[420px]"
      >
        <Image
          src={featured.thumbnailUrl || TYPE_IMAGE[featured.type]}
          alt=""
          fill
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0)_30%,rgba(2,6,23,0.85)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-wider" style={{ color: "#c7d2fe" }}>
            <featuredStyle.icon className="h-4 w-4" />
            Featured · {featuredStyle.label}
          </p>
          <h3 className="mt-2 font-serif text-[1.6rem] font-bold leading-tight text-white sm:text-[2rem]">{featured.name}</h3>
          <p className="mt-2 line-clamp-2 max-w-[42rem] text-[0.95rem] leading-relaxed text-white/75">{blurb(featured)}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-white">
            Start course <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>

      {rest.map((course) => {
        const style = TYPE_STYLES[course.type];
        return (
          <Link
            key={`${course.type}-${course.id}`}
            href={`/coursesv2/${course.id}`}
            className="group relative h-[190px] overflow-hidden rounded-2xl bg-[#0f172a]"
          >
            <Image
              src={course.thumbnailUrl || TYPE_IMAGE[course.type]}
              alt=""
              fill
              sizes="(min-width: 1024px) 380px, 50vw"
              className="object-cover opacity-70 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.1)_0%,rgba(2,6,23,0.8)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-white/70">{style.label}</p>
              <h3 className="mt-1 line-clamp-2 font-serif text-[1.05rem] font-bold leading-snug text-white">{course.name}</h3>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- C: card grid with a 50/50 image/content split ---------- */

function VariantC({ courses }: { courses: RepositoryContentItem[] }) {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((course) => {
        const style = TYPE_STYLES[course.type];
        return (
          <li key={`${course.type}-${course.id}`} className="h-full">
            <Link
              href={`/coursesv2/${course.id}`}
              className="group flex h-[360px] flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="relative h-1/2 shrink-0 overflow-hidden bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]">
                <Image
                  src={course.thumbnailUrl || TYPE_IMAGE[course.type]}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 300px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex h-1/2 flex-col px-4 pt-4 pb-4">
                <h3 className="line-clamp-2 font-serif text-[1.12rem] font-bold leading-snug text-[#020617]">{course.name}</h3>
                <p className="mt-2 line-clamp-3 text-[0.86rem] leading-relaxed text-[#475569]">{blurb(course)}</p>
                <p className="mt-auto pt-3 text-[0.82rem] font-medium" style={{ color: style.color }}>
                  {style.label}
                  {course.duration ? <span className="text-[#6b7280]"> · {course.duration} min</span> : null}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- D: type shelves — one horizontal snap strip per content type ---------- */

const TYPE_ORDER = ["scorm", "video", "game"] as const;

const NavArrow = ({ dir }: { dir: "left" | "right" }) => (
  <Svg className="h-4 w-4">
    <path d={dir === "left" ? "M19 12H5M11 18l-6-6 6-6" : "m9 18 6-6-6-6"} />
  </Svg>
);

/* One shelf: header with left/right paging, then a scrollbar-less snap strip. */
function Shelf({ type, items }: { type: RepositoryContentItem["type"]; items: RepositoryContentItem[] }) {
  const style = TYPE_STYLES[type];
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const scroll = (dir: number) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 300) + 16), behavior: "smooth" });
  };

  const trackEdges = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  };

  useEffect(() => {
    trackEdges();
    window.addEventListener("resize", trackEdges);
    return () => window.removeEventListener("resize", trackEdges);
  }, []);

  const navBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-[#d9d4c7] bg-white text-[#020617] shadow-sm transition-opacity disabled:opacity-40";

  return (
    <section aria-labelledby={`shelf-${type}`}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={`shelf-${type}`} className="flex items-center gap-2 font-serif text-[1.3rem] font-bold text-[#020617]">
          <span style={{ color: style.color }}><style.icon className="h-5 w-5" /></span>
          {style.label}
        </h2>
        <div className="flex items-center gap-3">
          <span className="hidden text-[0.85rem] text-[#6b7280] sm:inline">
            {items.length} course{items.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => scroll(-1)} aria-label={`Previous ${style.label} courses`} disabled={edges.start} className={navBtn}>
              <NavArrow dir="left" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={`Next ${style.label} courses`} disabled={edges.end} className={navBtn}>
              <NavArrow dir="right" />
            </button>
          </div>
        </div>
      </div>
      <ul
        ref={scroller}
        onScroll={trackEdges}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((course) => (
          <li key={`${course.type}-${course.id}`} className="w-[300px] shrink-0 snap-start">
            <Link href={`/coursesv2/${course.id}`} className="group flex h-full flex-col">
              <div className="relative h-[170px] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)]">
                <Image
                  src={course.thumbnailUrl || TYPE_IMAGE[course.type]}
                  alt=""
                  fill
                  sizes="300px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 line-clamp-2 font-serif text-[1.02rem] font-bold leading-snug text-[#020617]">{course.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-[0.84rem] leading-relaxed text-[#475569]">{blurb(course)}</p>
              <p className="mt-auto pt-2 text-[0.82rem] text-[#6b7280]">
                {course.duration ? `${course.duration} min` : style.label}
                {course.rating ? ` · ★ ${course.rating.toFixed(1)}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VariantD({ courses }: { courses: RepositoryContentItem[] }) {
  const groups = TYPE_ORDER.map((type) => ({
    type,
    items: courses.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mt-10 space-y-10">
      {groups.map(({ type, items }) => (
        <Shelf key={type} type={type} items={items} />
      ))}
    </div>
  );
}

/* ---------- E: catalogue index — dense numbered rows, tiny thumbs, no card chrome ---------- */

function VariantE({ courses }: { courses: RepositoryContentItem[] }) {
  return (
    <ol className="mt-10 border-y border-[#d9d4c7]/70">
      {courses.map((course, i) => {
        const style = TYPE_STYLES[course.type];
        return (
          <li key={`${course.type}-${course.id}`} className="border-b border-[#d9d4c7]/70 last:border-b-0">
            <Link
              href={`/coursesv2/${course.id}`}
              className="group grid grid-cols-[2rem_3.5rem_1fr] items-center gap-4 px-2 py-3.5 transition-colors hover:bg-white/60 sm:grid-cols-[2.5rem_4rem_1fr_auto]"
            >
              <span className="font-serif text-[0.95rem] tabular-nums text-[#94a3b8]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative h-12 w-14 overflow-hidden rounded-md bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)] sm:w-16">
                {course.thumbnailUrl ? (
                  <Image src={course.thumbnailUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <style.icon className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-serif text-[1.02rem] font-bold text-[#020617]">{course.name}</p>
                <p className="mt-0.5 text-[0.78rem] text-[#6b7280]">
                  <span style={{ color: style.color }}>{style.label}</span>
                  {course.duration ? ` · ${course.duration} min` : ""}
                </p>
              </div>
              <div className="hidden items-center gap-4 text-[0.82rem] text-[#475569] sm:flex">
                {course.rating ? <span>★ {course.rating.toFixed(1)}</span> : null}
                <span aria-hidden="true" className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export const VARIANTS = ["A", "B", "C", "D", "E"] as const;
export type PrototypeVariant = (typeof VARIANTS)[number];

const VARIANT_LABELS: Record<PrototypeVariant, string> = {
  A: "A (Editorial rows)",
  B: "B (Featured mosaic)",
  C: "C (Card grid — original)",
  D: "D (Type shelves)",
  E: "E (Catalogue index)",
};

export function CourseGridPrototype({
  courses,
  variant,
}: {
  courses: RepositoryContentItem[];
  variant: PrototypeVariant;
}) {
  if (variant === "B") return <VariantB courses={courses} />;
  if (variant === "C") return <VariantC courses={courses} />;
  if (variant === "D") return <VariantD courses={courses} />;
  if (variant === "E") return <VariantE courses={courses} />;
  return <VariantA courses={courses} />;
}

/* Floating variant switcher. */
export function PrototypeSwitcher({ current }: { current: PrototypeVariant }) {
  const router = useRouter();
  const pathname = usePathname();

  const go = (next: PrototypeVariant) => router.replace(`${pathname}?variant=${next}`, { scroll: false });
  const step = (dir: 1 | -1) =>
    go(VARIANTS[(VARIANTS.indexOf(current) + dir + VARIANTS.length) % VARIANTS.length]);

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full bg-[#020617] px-2 py-1.5 text-white shadow-[0_18px_40px_-12px_rgba(2,6,23,0.7)]">
        <button
          type="button"
          aria-label="Previous variant"
          onClick={() => step(-1)}
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
        >
          ←
        </button>
        <span className="px-2 text-[0.85rem] font-medium">{VARIANT_LABELS[current]}</span>
        <button
          type="button"
          aria-label="Next variant"
          onClick={() => step(1)}
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
        >
          →
        </button>
      </div>
      <PrototypeKeys onStep={step} />
    </div>
  );
}

function PrototypeKeys({ onStep }: { onStep: (dir: 1 | -1) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable)) return;
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStep]);
  return null;
}
