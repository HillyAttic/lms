"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "info" | "purple" | "blue" | "green" | "gray";
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  gray: "bg-gray-100 text-gray-800",
};

export default function Badge({ label, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 text-xs font-medium rounded-full",
        variantStyles[variant]
      )}
    >
      {label}
    </span>
  );
}
