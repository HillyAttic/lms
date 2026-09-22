"use client";

import { useMemo, useState } from "react";
import { Search } from "@/lib/icons";
import type { LeaderboardRow } from "@/app/actions/learner-actions";

const PAGE_SIZE = 10;

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

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <div className="relative sm:w-96">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search by user, course, type..."
            aria-label="Search the leaderboard"
            className="h-12 w-full rounded-full border border-gray-200 pr-5 pl-11 text-sm outline-0 placeholder:text-gray-400 focus:border-purple-300"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-500 text-white">
              <tr>
                {["ID", "User Name", "Course Name", "Type", "Score"].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3.5 text-left text-xs font-semibold tracking-wide uppercase"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visible.length > 0 ? (
                visible.map((row) => (
                  <tr key={row.id} className="text-sm text-gray-700">
                    <td className="px-4 py-4 tabular-nums">{row.id}</td>
                    <td className="px-4 py-4">{row.userName}</td>
                    <td className="px-4 py-4">{row.courseName}</td>
                    <td className="px-4 py-4">{row.type}</td>
                    <td className="px-4 py-4 tabular-nums">{row.score}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-secondary">
                    {rows.length === 0
                      ? "No scores yet — they appear as learners complete courses."
                      : "No rows match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPage(current - 1)}
          disabled={current === 1}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ‹ Prev
        </button>
        <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm">
          Page {current} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage(current + 1)}
          disabled={current === totalPages}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
