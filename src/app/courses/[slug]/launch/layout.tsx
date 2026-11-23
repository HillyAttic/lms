import { LandingFooter, LandingHeader } from "@/components/landing";

/* The classic player, wrapped in the site chrome. */
export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh text-[#334155]">
      {/* Every package asset is served by redirecting to Storage, so open that
          connection while the page is still being parsed. */}
      <link rel="preconnect" href="https://storage.googleapis.com" />
      <link rel="dns-prefetch" href="https://storage.googleapis.com" />
      <LandingHeader accent="#4338ca" />
      {children}
      <LandingFooter />
    </div>
  );
}
