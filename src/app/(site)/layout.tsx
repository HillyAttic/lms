import { LandingFooter, LandingHeader } from "@/components/landing";
import ThemeFlow from "@/components/v2/theme-flow";

/*
 * Shell for the new-theme public pages (/homev2/about, /contact, /repository,
 * /leaderboard, /watch, /shared). The page bodies are the existing screens,
 * reused verbatim inside the `.theme-v2` scope; ThemeFlow keeps their links in
 * this tree. /homev2 itself is outside this group and brings its own chrome.
 */
export default function ThemedPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh text-[#334155]">
      <LandingHeader />
      <ThemeFlow />
      {children}
      <LandingFooter />
    </div>
  );
}
