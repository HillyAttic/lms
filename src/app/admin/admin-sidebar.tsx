"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
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
} from "@/lib/icons";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Upload SCORM", href: "/admin/upload", icon: Upload },
  { label: "SCORM Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Video Courses", href: "/admin/video-courses", icon: Video },
  { label: "Game Courses", href: "/admin/game-courses", icon: Sparkles },
  { label: "Public Courses", href: "/admin/public-courses", icon: BookOpen },
  { label: "Blogs", href: "/admin/blogs", icon: FileText },
  { label: "Repository", href: "/admin/repository", icon: FileArchive },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/admin/login";
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-800 p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <p className="mt-1 truncate text-sm text-gray-400">
              {user?.email || "Admin"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors",
                  isActive
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-gray-800 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Site</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
