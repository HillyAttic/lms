"use server";

import { adminDb, FieldValue } from "@/lib/firebase-admin";

export interface ProgressData {
  courseId: string;
  userId: string;
  status: "incomplete" | "completed" | "passed" | "failed";
  score: number | null;
  sessionTime: number;
  suspendData: string;
  scoProgress?: Array<{
    scoId: string;
    status: string;
    score: number | null;
    time: number;
  }>;
}

export async function saveProgress(data: ProgressData) {
  try {
    const { courseId, userId, ...rest } = data;
    const progressId = `${userId}_${courseId}`;

    await adminDb.doc(`progress/${progressId}`).set(
      {
        ...rest,
        courseId,
        userId,
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Save progress error:", error);
    return { success: false, error: error.message };
  }
}

export async function getProgress(userId: string, courseId: string) {
  try {
    const progressId = `${userId}_${courseId}`;
    const progressDoc = await adminDb.doc(`progress/${progressId}`).get();

    if (progressDoc.exists) {
      return { success: true, data: progressDoc.data() };
    }

    return { success: true, data: null };
  } catch (error: any) {
    console.error("Get progress error:", error);
    return { success: false, error: error.message, data: null };
  }
}
