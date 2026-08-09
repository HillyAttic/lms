"use client";

import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/lib/protected-route";
import AdminSidebar from "./admin-sidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // Don't wrap the login page in ProtectedRoute - it needs to be accessible to unauthenticated users
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="flex min-h-screen bg-gray-100">
        <AdminSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
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
