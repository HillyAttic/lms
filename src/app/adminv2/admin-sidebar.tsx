"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  FileArchive,
  ArrowLeft,
  LogOut,
  CloseIcon,
  Video,
  Sparkles,
  FileText,
  Trophy,
} from "@/lib/icons";

const navItems = [
  { label: "Dashboard", href: "/adminv2", icon: LayoutDashboard },
  { label: "SCORM Courses", href: "/adminv2/courses", icon: BookOpen },
  { label: "Video Courses", href: "/adminv2/video-courses", icon: Video },
  { label: "Game Courses", href: "/adminv2/game-courses", icon: Sparkles },
  { label: "Public Courses", href: "/adminv2/public-courses", icon: BookOpen },
  { label: "Blogs", href: "/adminv2/blogs", icon: FileText },
  { label: "Repository", href: "/adminv2/repository", icon: FileArchive },
  { label: "Users", href: "/adminv2/users", icon: Users },
  { label: "Leaderboard", href: "/adminv2/leaderboard", icon: Trophy },
  { label: "External Users", href: "/adminv2/external-users", icon: Users },
  { label: "Settings", href: "/adminv2/settings", icon: Settings },
];

const GRADIENT = "linear-gradient(90deg,#2563eb 0%,#7c3aed 100%)";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebarV2({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/adminv2/login";
  };

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-[#020617]/40 transition-opacity backdrop-blur-sm lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#e5e7eb] bg-white/95 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-[#e5e7eb] p-6">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold text-[#020617]">Admin Panel</h2>
            <p className="mt-1 truncate text-sm text-[#64748b]">{user?.email || "Admin"}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close admin menu"
            className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#020617] lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/adminv2"
                ? pathname === "/adminv2"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white shadow-[0_10px_24px_-12px_rgba(79,70,229,0.8)]"
                    : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#020617]",
                )}
                style={isActive ? { backgroundImage: GRADIENT } : undefined}
              >
                <item.icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-[#e5e7eb] p-4">
          <Link
            href="/homev2"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#020617]"
          >
            <ArrowLeft className="size-5" />
            <span>Back to Site</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-[#475569] transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="size-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
