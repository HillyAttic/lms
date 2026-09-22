"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "react-toastify";
import { getLearnerDashboard } from "@/app/actions/learner-actions";
import Button from "@/components/ui/button";
import { ArrowLeft, DownloadIcon } from "@/lib/icons";
import { siteName } from "@/utils/envExport";

export default function CertificatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, loading } = useAuth();
  const [course, setCourse] = useState<{ name: string; score: number | null } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) return;

    let isCurrent = true;
    void (async () => {
      const result = await getLearnerDashboard(await user.getIdToken());
      if (!isCurrent) return;

      if (!result.success) {
        toast.error("Could not load your certificate.");
        setChecked(true);
        return;
      }

      // Posting a slug by hand must not mint an award, so the record is looked
      // up among the learner's completed courses rather than rendered on faith.
      const match = result.data.certificates.find((item) => item.slug === slug);
      if (match) setCourse({ name: match.name, score: match.progress?.score ?? null });
      setChecked(true);
    })();

    return () => {
      isCurrent = false;
    };
  }, [user, slug]);

  if (loading || !checked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!course) notFound();

  const issued = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* The award itself is the printable region — "Download" is the browser's
          print-to-PDF, so nothing has to be generated or stored. */}
      <div className="rounded-3xl border-4 border-purple-500/30 p-6 text-center sm:p-12">
        <p className="text-sm font-semibold tracking-widest text-purple-600 uppercase">
          Certificate of Completion
        </p>
        <p className="mt-6 text-secondary">This certifies that</p>
        <p className="mt-2 text-3xl font-bold">
          {user?.displayName || user?.email?.split("@")[0]}
        </p>
        <p className="mt-6 text-secondary">has successfully completed</p>
        <p className="mt-2 text-2xl font-semibold">{course.name}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-gray-500">
          {course.score !== null && <span>Score: {course.score.toFixed(2)}</span>}
          <span>Issued: {issued}</span>
          <span>{siteName}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 print:hidden">
        <Button onClick={() => window.print()} className="px-6">
          Download
          <DownloadIcon />
        </Button>
        <Link
          href="/dashboard/certificates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="size-4" />
          Back to certificates
        </Link>
      </div>
    </div>
  );
}
