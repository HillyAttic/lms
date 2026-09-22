"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import LeaderboardTable from "@/components/leaderboard-table";
import { getLeaderboardRows, type LeaderboardRow } from "@/app/actions/learner-actions";

export default function AdminLeaderboardPage() {
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

  if (rows === null) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Every learner's best recorded score, newest first"
      />
      <LeaderboardTable rows={rows} />
    </div>
  );
}
