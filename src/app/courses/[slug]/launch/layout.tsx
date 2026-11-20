import { LandingFooter, LandingHeader } from "@/components/landing";
import ThemeFlow from "@/components/v2/theme-flow";

/* The classic player, wrapped in the new theme's chrome. */
export default function LaunchLayoutV2({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-v2 theme-v2-page theme-v2-static min-h-dvh text-[#334155]">
      <LandingHeader />
      <ThemeFlow />
      {children}
      <LandingFooter />
    </div>
  );
}
