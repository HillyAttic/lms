"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { LeaderboardRow } from "@/app/actions/learner-actions";

const PAGE_SIZE = 10;

export const RANK_BADGE = [
  "bg-yellow-500 text-white",
  "bg-gray-300 text-gray-900",
  "bg-yellow-700 text-white",
];

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "?";

const TYPE_STYLES: Record<string, string> = {
  scorm: "bg-purple-50 text-purple-700",
  video: "bg-sky-50 text-sky-800",
  game: "bg-yellow-50 text-yellow-800",
};

/** 1 … 4 5 6 … 12, so a long board still fits on one line. */
function pageList(total: number, current: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const near = [current - 1, current, current + 1].filter((p) => p > 1 && p < total);
  return [
    1,
    ...(near[0] > 2 ? (["…"] as const) : []),
    ...near,
    ...(near[near.length - 1] < total - 1 ? (["…"] as const) : []),
    total,
  ];
}

/**
 * The board itself, shared by the public page and the admin panel so both read
 * the same figures from the same server action. Search and paging are local:
 * the row set is small and fully loaded, so paging it server-side would only
 * add a round trip.
 */
export default function LeaderboardTable({
  rows,
  className,
}: {
  rows: LeaderboardRow[];
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.userName, row.courseName, row.type].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  // Bars are relative to the highest score on the board, not to a fixed max —
  // the scale depends on how the SCORM package reported its score.
  const maxScore = Math.max(1, ...rows.map((row) => row.score));

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">
          {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          {search ? " match your search" : " on the board"}
        </p>
        <div className="relative sm:w-80">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search by user, course, type..."
            aria-label="Search the leaderboard"
            className="h-11 w-full rounded-full border border-gray-200 pr-5 pl-11 text-sm outline-0 placeholder:text-gray-400 focus:border-purple-300"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold tracking-sm text-secondary uppercase">
                <th scope="col" className="px-4 py-3.5 font-semibold sm:px-6">
                  #
                </th>
                <th scope="col" className="px-4 py-3.5 font-semibold">
                  Learner
                </th>
                <th scope="col" className="px-4 py-3.5 font-semibold">
                  Course
                </th>
                <th scope="col" className="px-4 py-3.5 font-semibold max-sm:hidden">
                  Type
                </th>
                <th scope="col" className="px-4 py-3.5 text-right font-semibold sm:px-6">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length > 0 ? (
                visible.map((row, index) => {
                  const rank = (current - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3.5 sm:px-6">
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                            rank <= 3 ? RANK_BADGE[rank - 1] : "bg-gray-100 text-secondary",
                          )}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                            {initials(row.userName)}
                          </span>
                          <span className="font-medium text-gray-900">{row.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700">{row.courseName}</td>
                      <td className="px-4 py-3.5 max-sm:hidden">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                            TYPE_STYLES[row.type] ?? "bg-gray-100 text-secondary",
                          )}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center justify-end gap-3">
                          <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 sm:block">
                            <span
                              className="block h-full rounded-full bg-purple-500"
                              style={{ width: `${Math.max(4, (row.score / maxScore) * 100)}%` }}
                            />
                          </span>
                          <span className="w-10 text-right font-semibold tabular-nums text-gray-900">
                            {row.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <p className="font-medium text-gray-900">
                      {rows.length === 0 ? "No scores yet" : "No rows match your search"}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      {rows.length === 0
                        ? "They appear here as learners complete courses."
                        : "Try a different name, course or type."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Leaderboard pages"
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => setPage(current - 1)}
            disabled={current === 1}
            aria-label="Previous page"
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-5" />
          </button>
          {pageList(totalPages, current).map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="px-1 text-secondary">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                aria-current={item === current ? "page" : undefined}
                className={cn(
                  "size-9 rounded-lg text-sm font-medium transition-colors",
                  item === current
                    ? "bg-purple-500 text-white"
                    : "border border-gray-200 hover:bg-gray-50",
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => setPage(current + 1)}
            disabled={current === totalPages}
            aria-label="Next page"
            className="flex size-9 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-5" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
