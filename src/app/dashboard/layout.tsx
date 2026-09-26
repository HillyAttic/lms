"use client";

import { ProtectedRoute } from "@/lib/protected-route";
import LearnerSidebar from "./learner-sidebar";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-5rem)] py-8 sm:py-12 lg:py-16">
        <div className="container">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
            <LearnerSidebar />
            <div className="w-full min-w-0 flex-1 rounded-[24px] border-[1.5px] border-ink bg-white p-5 sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
