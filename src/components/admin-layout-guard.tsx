"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function AdminLayoutGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  // /homev2 and /coursesv2 are self-contained landing pages with their own
  // header/footer.
  const isStandalone = pathname === "/homev2" || pathname === "/coursesv2";

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
