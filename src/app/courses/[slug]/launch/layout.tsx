import { LandingFooter, LandingHeader } from "@/components/landing";

/* The classic player, wrapped in the site chrome. */
export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh text-[#334155]">
      <LandingHeader accent="#4338ca" />
      {children}
      <LandingFooter />
    </div>
  );
}
