"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "@/components/admin/page-header";
import LoadingSpinner from "@/components/admin/loading-spinner";
import StatCard from "@/components/admin/stat-card";
import Badge from "@/components/admin/badge";
import SearchFilterBar from "@/components/admin/search-filter-bar";
import EmptyState from "@/components/admin/empty-state";
import { Users, BookOpen, Trophy, BarChart, RefreshCw } from "@/lib/icons";
import {
  getScormAnalytics,
  type ScormAnalytics,
} from "@/app/actions/analytics-actions";

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  passed: { label: "Passed", variant: "success" },
  completed: { label: "Completed", variant: "info" },
  failed: { label: "Failed", variant: "danger" },
  incomplete: { label: "In progress", variant: "warning" },
};

function formatDate(timestamp: { seconds: number } | null) {
  if (!timestamp?.seconds) return "—";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AnalyticsPage() {
  const [data, setData] = useState<ScormAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isCurrent = true;
    void (async () => {
      const result = await getScormAnalytics();
      if (!isCurrent) return;
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast.error("Failed to load analytics");
      }
      setLoading(false);
    })();
    return () => {
      isCurrent = false;
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    const result = await getScormAnalytics();
    if (result.success && result.data) {
      setData(result.data);
      toast.success("Analytics refreshed");
    } else {
      toast.error("Failed to load analytics");
    }
    setRefreshing(false);
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data.rows;
    return data.rows.filter((row) =>
      [row.userName, row.userEmail, row.courseName].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [data, search]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="SCORM results reported by each learner — the latest attempt wins"
        actions={
          <button
            onClick={() => void refresh()}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attempts"
          value={data?.totalAttempts ?? 0}
          icon={<BarChart className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Learners"
          value={data?.learners ?? 0}
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Completed"
          value={data?.completed ?? 0}
          icon={<Trophy className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Average score"
          value={data?.averageScore === null || data?.averageScore === undefined ? "—" : `${data.averageScore}%`}
          icon={<BookOpen className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <SearchFilterBar
        searchPlaceholder="Search by learner or course..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="No SCORM results yet"
          description="Scores will appear here as learners work through a course"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-ink bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Learner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Course
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:table-cell">
                    SCORM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    Score
                  </th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 md:table-cell">
                    Last activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row) => {
                  const status = STATUS[row.status] ?? STATUS.incomplete;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{row.userName}</div>
                        {row.userEmail && (
                          <div className="text-sm text-gray-500">{row.userEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{row.courseName}</td>
                      <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
                        {row.scormVersion}
                      </td>
                      <td className="px-6 py-4">
                        <Badge label={status.label} variant={status.variant} />
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums text-gray-900">
                        {row.score === null ? "—" : `${row.score}%`}
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-gray-600 md:table-cell">
                        {formatDate(row.lastUpdated)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
