import type { Metadata } from "next";
import "./globals.css";
import { siteName, siteUrl } from "@/utils/envExport";
import { Poppins, Source_Serif_4 } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AuthProvider } from "@/lib/auth-context";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayoutGuard from "@/components/admin-layout-guard";

/*
 * One family for the whole app. The three variable names the template shipped
 * with are all pointed at Poppins so existing `font-mulish` / `font-inter`
 * call sites keep working — and we download one font instead of three.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

/* Editorial serif for display headings (the /homev2 landing page). Same
   self-hosted strategy as Poppins, so no request leaves the origin. */
const sourceSerif = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: `${siteName}`,
  description: `${siteName} Online Learning Platform. Create your own online courses and sell them to the world.`,
  keywords: ["EdventureHub ", "EdventureHub "],

  openGraph: {
    title: `${siteName}`,
    description: `${siteName} Online Learning Platform. Create your own online courses and sell them to the world.`,
    type: "website",
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "EdventureHub  Online Learning Platform",
      },
    ],
  },

  twitter: {
    title: `${siteName}`,
    description: `${siteName} Online Learning Platform. Create your own online courses and sell them to the world.`,
    card: "summary_large_image",
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "EdventureHub  Online Learning Platform",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${sourceSerif.variable}`}>
        <AuthProvider>
          <AdminLayoutGuard>
            {children}
          </AdminLayoutGuard>
          {/* Only one container may be mounted: two both render and animate the
              same toast, so the duplicate never auto-closes and stays stuck. */}
          <ToastContainer
            position="top-right"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </body>
    </html>
  );
}
