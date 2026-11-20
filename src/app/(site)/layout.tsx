import { LandingFooter, LandingHeader } from "@/components/landing";

/* Shell for the public pages (about, contact, repository, leaderboard, watch,
 * shared) so they all sit on the same crumpled-paper theme. `/` brings its own
 * chrome; /courses and /dashboard have their own layouts. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh text-[#334155]">
      <LandingHeader accent="#4338ca" />
      {children}
      <LandingFooter />
    </div>
  );
}
