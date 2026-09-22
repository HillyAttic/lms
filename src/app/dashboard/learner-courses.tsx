"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import { useAuth } from "@/lib/auth-context";
import { getLearnerDashboard } from "@/app/actions/learner-actions";
import { BookOpen, DownloadIcon, Heart, Star } from "@/lib/icons";
import type { LearnerCourse } from "@/app/actions/learner-actions";

export type DashboardData = Awaited<ReturnType<typeof getLearnerDashboard>>["data"];

/**
 * Every page under /dashboard reads the same payload — the three lists and the
 * three counts — so the fetch lives here once and each page picks its slice.
 */
export function useLearnerDashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (!user) return;

    let isCurrent = true;
    void (async () => {
      const result = await getLearnerDashboard(await user.getIdToken());
      if (!isCurrent) return;
      if (result.success) {
        setData(result.data);
      } else {
        toast.error("Could not load your dashboard.");
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, [user]);

  return { data, loading: loading || (!data && !!user) };
}

/** Videos keep their dedicated player; SCORM and games browse their detail page first. */
export function launchHref(course: LearnerCourse) {
  return course.type === "video" ? `/watch/${course.id}` : `/courses/${course.slug}/launch`;
}

function Thumbnail({ course }: { course: LearnerCourse }) {
  if (!course.thumbnailUrl) {
    return (
      <div className="grid aspect-16/10 w-full place-items-center rounded-2xl bg-gray-50 text-gray-300">
        <Star className="size-8" />
      </div>
    );
  }
  return (
    // Thumbnails are signed storage URLs, which next/image is not configured for.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={course.thumbnailUrl}
      alt={course.name}
      loading="lazy"
      className="aspect-16/10 w-full rounded-2xl object-cover"
    />
  );
}

/**
 * The one card all three lists render. `action` is the button the list calls
 * for — "Continue" while a course is in flight, "Download" once it is finished.
 */
export function LearnerCourseCard({
  course,
  action = "Continue",
}: {
  course: LearnerCourse;
  action?: "Continue" | "View" | "Download";
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-gray-200 p-3">
      <Thumbnail course={course} />
      <div className="flex grow flex-col px-1 pt-4">
        <span className="self-start rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 uppercase">
          {course.type}
        </span>
        <h3 className="mt-3 grow font-medium md:text-lg">
          <Link href={`/courses/${course.slug}`} className="transition-colors hover:text-purple-500">
            {course.name}
          </Link>
        </h3>
        <Button asChild variant="outline" size="lg" className="mt-5 w-full">
          {action === "View" ? (
            <Link href={`/courses/${course.slug}`}>
              View
              <ButtonArrow />
            </Link>
          ) : (
            <Link href={launchHref(course)}>
              {action}
              {action === "Download" ? <DownloadIcon /> : <ButtonArrow />}
            </Link>
          )}
        </Button>
      </div>
    </li>
  );
}

/** Shared empty state for the three lists — only the wording differs. */
export function LearnerEmptyState({
  message,
  cta = true,
}: {
  message: string;
  cta?: boolean;
}) {
  return (
    <div className="grid place-items-center py-16 text-center">
      <Heart className="size-10 text-gray-300" />
      <p className="mt-4 text-secondary">{message}</p>
      {cta && (
        <Button asChild className="mt-6 px-6">
          <Link href="/courses">
            Browse courses
            <ButtonArrow />
          </Link>
        </Button>
      )}
    </div>
  );
}

export function LearnerPageHeading({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count?: number;
  icon: typeof BookOpen;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-6 text-purple-500" />
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {count !== undefined && (
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-secondary">
          {count}
        </span>
      )}
    </div>
  );
}

