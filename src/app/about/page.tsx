import { type Metadata } from "next";
import About from "@/components/about";
import { siteName, siteUrl } from "@/utils/envExport";

export const metadata: Metadata = {
  title: `About | ${siteName}`,
  description: `${siteName} is a self-paced learning platform built around short lessons, real practice, and progress you can see.`,
  alternates: { canonical: `${siteUrl}/about` },
};

export default function AboutPage() {
  return <About />;
}
