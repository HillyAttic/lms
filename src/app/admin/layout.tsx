"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import { MenuIcon } from "@/lib/icons";
import AdminSidebar from "./admin-sidebar";

/* Admin shell: the admin screens themselves live under this layout. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The login page must stay reachable while signed out.
  if (isLoginPage) {
    return <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh">{children}</div>;
  }

  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-screen text-[#334155]">
      <ProtectedRoute adminOnly loginHref="/admin/login">
        <div className="flex min-h-screen">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
        </div>
      </ProtectedRoute>
    </div>
  );
}
