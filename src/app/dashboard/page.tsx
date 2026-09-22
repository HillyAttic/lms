"use client";

import Link from "next/link";
import LearningProgress from "./learning-progress";
import { useLearnerDashboard } from "./learner-courses";
import { Certificate, DashboardIcon, GraduationHat, Heart } from "@/lib/icons";

const statTiles = [
  { key: "enrolled", label: "Enrolled Courses", href: "/dashboard/enrolled", icon: GraduationHat },
  { key: "certificates", label: "Certificates", href: "/dashboard/certificates", icon: Certificate },
  { key: "wishlist", label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
] as const;

export default function LearnerDashboardPage() {
  const { data, loading } = useLearnerDashboard();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <DashboardIcon className="size-6 text-purple-500" />
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
      </div>
      <p className="mt-1 text-secondary">Welcome back, {data?.name || "learner"}!</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {statTiles.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className="rounded-2xl border-2 border-purple-500/40 p-5 transition-colors hover:border-purple-500"
          >
            <p className="text-3xl font-bold">{data?.stats[tile.key] ?? 0}</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
              <tile.icon className="size-5 text-purple-500" />
              {tile.label}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-center text-lg font-semibold">Your Learning Progress</h2>
      <LearningProgress
        stats={data?.stats || { enrolled: 0, certificates: 0, wishlist: 0 }}
      />
    </div>
  );
}
