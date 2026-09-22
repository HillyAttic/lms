"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import LeaderboardTable, { initials, RANK_BADGE } from "@/components/leaderboard-table";
import { getLeaderboardRows, type LeaderboardRow } from "@/app/actions/learner-actions";
import { Trophy } from "@/lib/icons";
import { cn } from "@/lib/utils";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void (async () => {
      const result = await getLeaderboardRows();
      if (!isCurrent) return;
      if (result.success) {
        setRows(result.data);
      } else {
        toast.error("Could not load the leaderboard.");
        setRows([]);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, []);

  // Rows arrive newest-record-first, so the board itself is ordered by score.
  const top = [...(rows ?? [])].sort((a, b) => b.score - a.score).slice(0, 3);
  // The podium reads 2 · 1 · 3 with the winner raised in the middle.
  const podium = [top[1], top[0], top[2]].filter(
    (row): row is LeaderboardRow => Boolean(row),
  );
  const average = rows?.length
    ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)
    : 0;
  const leaders = new Set(rows?.map((row) => row.userName)).size;

  return (
    <main>
      <section className="bg-purple-500 py-12 text-center text-primary sm:py-16">
        <div className="container">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold tracking-[-0.6px] sm:text-4xl">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
              <Trophy className="size-7" />
            </span>
            Global Leaderboard
          </h1>
          <p className="mt-3 text-primary/80 sm:text-lg">
            See how you stack up against other learners
          </p>

          {rows && rows.length > 0 ? (
            <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                { label: "Entries", value: rows.length },
                { label: "Learners", value: leaders },
                { label: "Average score", value: average },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl bg-primary/10 px-3 py-4 backdrop-blur-sm"
                >
                  <dt className="text-xs font-medium tracking-sm text-primary/70 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="container">
          {rows === null ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {top.length > 0 ? (
                <div className="mb-10 grid items-end gap-4 sm:grid-cols-3">
                  {podium.map((row) => {
                    const rank = top.indexOf(row) + 1;
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-card",
                          rank === 1 && "sm:order-none sm:pb-10 sm:pt-8",
                          rank === 2 && "sm:order-first",
                        )}
                      >
                        <span
                          className={cn(
                            "mx-auto flex size-16 items-center justify-center rounded-full text-lg font-bold",
                            RANK_BADGE[rank - 1],
                          )}
                        >
                          {initials(row.userName)}
                        </span>
                        <p className="mt-4 truncate font-semibold text-gray-900">
                          {row.userName}
                        </p>
                        <p className="mt-1 truncate text-sm text-secondary">
                          {row.courseName}
                        </p>
                        <p className="mt-4 text-3xl font-bold tabular-nums text-purple-600">
                          {row.score}
                        </p>
                        <p className="mt-1 text-xs font-medium tracking-sm text-gray-400 uppercase">
                          Rank #{rank}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <LeaderboardTable rows={rows} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
