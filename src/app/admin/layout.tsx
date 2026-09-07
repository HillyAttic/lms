"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import AdminSidebar from "./admin-sidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MenuIcon } from "@/lib/icons";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't wrap the login page in ProtectedRoute - it needs to be accessible to unauthenticated users
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ProtectedRoute>
  );
}
