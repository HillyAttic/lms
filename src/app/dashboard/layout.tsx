"use client";

import { LandingFooter, LandingHeader } from "@/components/landing";
import { ProtectedRoute } from "@/lib/protected-route";
import LearnerSidebar from "./learner-sidebar";

/* Learner area: dashboard screens on the paper shell. */
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh text-[#334155]">
      <LandingHeader accent="#4338ca" />
      <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8 lg:py-14">
        <ProtectedRoute loginHref="/#login">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:gap-8">
            <LearnerSidebar />
            <div className="w-full min-w-0 flex-1 rounded-2xl border border-[#e5e7eb] bg-white/90 p-5 shadow-[0_14px_30px_-22px_rgba(2,6,23,0.35)] backdrop-blur-sm sm:p-8">
              {children}
            </div>
          </div>
        </ProtectedRoute>
      </div>
      <LandingFooter />
    </div>
  );
}
