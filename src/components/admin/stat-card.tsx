"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: "purple" | "green" | "blue" | "yellow" | "red";
  className?: string;
}

const colorStyles: Record<string, { bg: string; icon: string }> = {
  purple: { bg: "bg-accent", icon: "text-ink" },
  green: { bg: "bg-green-50", icon: "text-green-700" },
  blue: { bg: "bg-muted", icon: "text-ink" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-800" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
};

export default function StatCard({ title, value, icon, color = "purple", className }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "rounded-2xl border-[1.5px] border-ink bg-white p-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-full border-[1.5px] border-ink",
            styles.bg,
          )}
        >
          <div className={cn("size-6", styles.icon)}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">
            {title}
          </p>
          <p className="mt-1 text-2xl font-bold tracking-[-0.03em] tabular-nums">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
