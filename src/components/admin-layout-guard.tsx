"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function AdminLayoutGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  // /homev2, /coursesv2 and /adminv2 are self-contained trees with their own
  // header/footer — including their subroutes (e.g. /coursesv2/[slug]).
  const isStandalone =
    pathname.startsWith("/homev2") ||
    pathname.startsWith("/coursesv2") ||
    pathname.startsWith("/adminv2");

  if (isAdmin || isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
