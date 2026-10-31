"use client";

import { useAuth } from "@/lib/auth-context";
import { canAccessAdminPanel } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Admin panel gate: admin and manager only. Learners and instructors are bounced. */
  adminOnly?: boolean;
  instructorOrAbove?: boolean;
  /** Where unauthenticated visitors go. The new theme points at its own login. */
  loginHref?: string;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
  instructorOrAbove = false,
  loginHref = "/admin/login",
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(loginHref);
      } else if (adminOnly && !canAccessAdminPanel(role)) {
        router.replace("/");
      } else if (instructorOrAbove && !canAccessAdminPanel(role) && role !== "instructor") {
        router.replace("/");
      }
    }
  }, [user, role, loading, router, adminOnly, instructorOrAbove, loginHref]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || (adminOnly && !canAccessAdminPanel(role)) || (instructorOrAbove && !canAccessAdminPanel(role) && role !== "instructor")) {
    return null;
  }

  return <>{children}</>;
}
