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
  ArrowLeft,
  LogOut,
} from "@/lib/icons";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Upload SCORM", href: "/admin/upload", icon: Upload },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Users", href: "/admin/users", icon: Users },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/admin/login";
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <p className="text-sm text-gray-400 mt-1 truncate">
          {user?.email || "Admin"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
