import { type Metadata } from "next";
import Contact from "@/components/contact";
import { siteName, siteUrl } from "@/utils/envExport";

export const metadata: Metadata = {
  title: `Contact | ${siteName}`,
  description: `Get in touch with the ${siteName} team — questions about courses, accounts, or partnerships.`,
  alternates: { canonical: `${siteUrl}/contact` },
};

export default function ContactPage() {
  return <Contact />;
}
