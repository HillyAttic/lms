"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import LeaderboardTable from "@/components/leaderboard-table";
import { getLeaderboardRows, type LeaderboardRow } from "@/app/actions/learner-actions";
import { Trophy } from "@/lib/icons";

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

  return (
    <main>
      <section className="bg-purple-500 py-14 text-center text-primary sm:py-16">
        <div className="container">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold sm:text-4xl">
            <Trophy className="size-9" />
            Global Leaderboard
          </h1>
          <p className="mt-3 text-primary/80">See how you stack up against other learners</p>
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="container">
          {rows === null ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            </div>
          ) : (
            <LeaderboardTable rows={rows} />
          )}
        </div>
      </section>
    </main>
  );
}
