"use server";

import { adminDb, serializeTimestamps } from "@/lib/firebase-admin";

export async function getDashboardStats() {
  try {
    // Get course counts
    const coursesSnapshot = await adminDb.collection("courses").get();
    const courses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalCourses = courses.length;
    const activeCourses = courses.filter((c: any) => c.status === "active").length;
    const draftCourses = courses.filter((c: any) => c.status === "draft").length;

    // Get user counts
    const usersSnapshot = await adminDb.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalUsers = users.length;
    const adminCount = users.filter((u: any) => u.role === "admin").length;
    const instructorCount = users.filter((u: any) => u.role === "instructor").length;
    const learnerCount = users.filter((u: any) => u.role === "learner").length;

    // Get recent uploads (last 5 courses)
    const recentSnapshot = await adminDb
      .collection("courses")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();
    const recentUploads = recentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      data: serializeTimestamps({
        totalCourses,
        activeCourses,
        draftCourses,
        totalUsers,
        adminCount,
        instructorCount,
        learnerCount,
        recentUploads,
      }),
    };
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: error.message };
  }
}

export async function getRecentActivity(limit: number = 5) {
  try {
    const snapshot = await adminDb
      .collection("courses")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const activities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: serializeTimestamps(activities) };
  } catch (error: any) {
    console.error("Get recent activity error:", error);
    return { success: false, error: error.message };
  }
}
