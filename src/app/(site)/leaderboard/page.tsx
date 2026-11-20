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
      <section className="border-b-[1.5px] border-ink bg-dark py-14 text-white sm:py-20">
        <div className="container">
          <span className="grid size-12 place-items-center rounded-full bg-accent text-ink">
            <Trophy className="size-6" />
          </span>
          <h1 className="display-2 mt-6 text-balance">
            Global <span className="marker">leaderboard</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-white/60">
            See how you stack up against other learners.
          </p>

          {rows && rows.length > 0 ? (
            <dl className="mt-10 grid max-w-2xl gap-px overflow-hidden rounded-[24px] border-[1.5px] border-white/20 bg-white/20 sm:grid-cols-3">
              {[
                { label: "Entries", value: rows.length },
                { label: "Learners", value: leaders },
                { label: "Average score", value: average },
              ].map(({ label, value }) => (
                <div key={label} className="bg-dark px-5 py-5">
                  <dt className="text-[0.6875rem] font-semibold tracking-[0.08em] text-white/50 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-1.5 text-3xl font-bold tracking-[-0.03em] tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container">
          {rows === null ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="size-10 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
            </div>
          ) : (
            <>
              {top.length > 0 ? (
                <div className="mb-12 grid items-end gap-5 sm:grid-cols-3">
                  {podium.map((row) => {
                    const rank = top.indexOf(row) + 1;
                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "card-brutal bg-white p-6 text-center",
                          rank === 1 && "sm:order-none sm:pt-8 sm:pb-10",
                          rank === 2 && "sm:order-first",
                        )}
                      >
                        <span
                          className={cn(
                            "mx-auto flex size-16 items-center justify-center rounded-full border-[1.5px] border-ink text-lg font-bold",
                            RANK_BADGE[rank - 1],
                          )}
                        >
                          {initials(row.userName)}
                        </span>
                        <p className="mt-4 truncate font-bold">
                          {row.userName}
                        </p>
                        <p className="mt-1 truncate text-sm text-secondary">
                          {row.courseName}
                        </p>
                        <p className="mt-4 text-3xl font-bold tracking-[-0.03em] tabular-nums">
                          {row.score}
                        </p>
                        <p className="mt-1 text-[0.6875rem] font-semibold tracking-[0.1em] text-secondary uppercase">
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
