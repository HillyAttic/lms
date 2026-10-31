"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import ThemeFlow from "@/components/v2/theme-flow";
import { MenuIcon } from "@/lib/icons";
import AdminSidebarV2 from "./admin-sidebar";

/*
 * New-theme admin shell. The screens themselves are the existing admin pages,
 * reused through thin route files; `.theme-v2` restyles them and ThemeFlow
 * keeps their links on /adminv2. The classic /admin tree is untouched.
 */
export default function AdminLayoutV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/adminv2/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoginPage) {
    return <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh">{children}</div>;
  }

  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-screen text-[#334155]">
      <ProtectedRoute adminOnly loginHref="/adminv2/login">
        <div className="flex min-h-screen">
          <AdminSidebarV2 isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center gap-3 border-b border-[#e5e7eb] bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open admin menu"
                className="flex size-9 items-center justify-center rounded-lg text-[#475569] hover:bg-[#f1f5f9]"
              >
                <MenuIcon />
              </button>
              <h1 className="font-serif text-lg font-bold text-[#020617]">Admin Panel</h1>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>

          <ThemeFlow />
        </div>
      </ProtectedRoute>
    </div>
  );
}
