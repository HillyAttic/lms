"use server";

import { adminDb, serializeTimestamps } from "@/lib/firebase-admin";

export type ScormAnalyticsRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseName: string;
  scormVersion: string;
  status: string;
  score: number | null;
  sessionTime: number;
  lastUpdated: { seconds: number; nanoseconds: number } | null;
};

export type ScormAnalytics = {
  rows: ScormAnalyticsRow[];
  totalAttempts: number;
  completed: number;
  averageScore: number | null;
  learners: number;
};

/**
 * One row per learner per SCORM course, read from the `progress` records the
 * player writes. A retake overwrites the same `{userId}_{courseId}` document,
 * so the score shown here is always the latest attempt — no history to merge.
 */
export async function getScormAnalytics() {
  try {
    const [progress, users, courses] = await Promise.all([
      adminDb.collection("progress").get(),
      adminDb.collection("users").get(),
      adminDb.collection("repository").get(),
    ]);

    const profiles = new Map(
      users.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            name: data.displayName || data.email?.split("@")[0] || "Unknown user",
            email: data.email || "",
          },
        ];
      })
    );

    const courseInfo = new Map(
      courses.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            name: data.name || data.title || doc.id,
            scormVersion: data.scormVersion || "—",
          },
        ];
      })
    );

    const rows: ScormAnalyticsRow[] = progress.docs
      .map((doc) => {
        const data = doc.data();
        const profile = profiles.get(data.userId);
        const course = courseInfo.get(data.courseId);
        return {
          id: doc.id,
          userId: data.userId as string,
          userName: profile?.name ?? "Unknown user",
          userEmail: profile?.email ?? "",
          courseName: course?.name ?? data.courseId,
          scormVersion: course?.scormVersion ?? "—",
          status: (data.status as string) || "incomplete",
          score: typeof data.score === "number" ? data.score : null,
          sessionTime: (data.sessionTime as number) || 0,
          lastUpdated: serializeTimestamps(data.lastUpdated),
        };
      })
      .sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));

    const scored = rows.filter((row) => row.score !== null);
    const averageScore = scored.length
      ? Math.round(
          (scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length) * 100
        ) / 100
      : null;

    return {
      success: true,
      data: {
        rows,
        totalAttempts: rows.length,
        completed: rows.filter(
          (row) => row.status === "completed" || row.status === "passed"
        ).length,
        averageScore,
        learners: new Set(rows.map((row) => row.userId)).size,
      } satisfies ScormAnalytics,
    };
  } catch (error) {
    console.error("Get SCORM analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      data: null,
    };
  }
}
