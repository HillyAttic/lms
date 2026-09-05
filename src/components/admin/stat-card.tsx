"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: "purple" | "green" | "blue" | "yellow" | "red";
}

const colorStyles: Record<string, { bg: string; icon: string }> = {
  purple: { bg: "bg-purple-50", icon: "text-purple-600" },
  green: { bg: "bg-green-50", icon: "text-green-600" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
};

export default function StatCard({ title, value, icon, color = "purple" }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-lg", styles.bg)}>
          <div className={cn("w-6 h-6", styles.icon)}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
