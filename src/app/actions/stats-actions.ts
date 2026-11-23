"use server";

import { adminDb, serializeTimestamps } from "@/lib/firebase-admin";

export async function getDashboardStats() {
  try {
    // Get SCORM course counts — SCORM items live in `repository`.
    const coursesSnapshot = await adminDb.collection("repository").get();
    const courses = coursesSnapshot.docs.map((doc) => doc.data());

    const totalCourses = courses.length;
    const activeCourses = courses.filter(
      (c: any) => (c.status || "active") === "active"
    ).length;
    const draftCourses = courses.filter((c: any) => c.status === "draft").length;

    // Get video course counts
    const videoCoursesSnapshot = await adminDb.collection("video_courses").get();
    const videoCourses = videoCoursesSnapshot.docs.map((doc) => doc.data());
    const totalVideoCourses = videoCourses.length;
    const activeVideoCourses = videoCourses.filter((c: any) => c.status === "active").length;

    // Get game course counts
    const gameCoursesSnapshot = await adminDb.collection("game_courses").get();
    const gameCourses = gameCoursesSnapshot.docs.map((doc) => doc.data());
    const totalGameCourses = gameCourses.length;
    const activeGameCourses = gameCourses.filter((c: any) => c.status === "active").length;

    // Get blog counts
    const blogsSnapshot = await adminDb.collection("blogs").get();
    const blogs = blogsSnapshot.docs.map((doc) => doc.data());
    const totalBlogs = blogs.length;
    const publishedBlogs = blogs.filter((b: any) => b.status === "published").length;

    // Get user counts
    const usersSnapshot = await adminDb.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalUsers = users.length;
    const adminCount = users.filter((u: any) => u.role === "admin").length;
    const managerCount = users.filter((u: any) => u.role === "manager").length;
    const learnerCount = users.filter((u: any) => u.role === "learner").length;

    // Get recent uploads (last 5 courses)
    const recentSnapshot = await adminDb
      .collection("repository")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();
    const recentUploads = recentSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        title: data.name || data.title || "Untitled",
        status: data.status || "active",
      };
    });

    return {
      success: true,
      data: serializeTimestamps({
        totalCourses: totalCourses + totalVideoCourses + totalGameCourses,
        totalBlogs,
        publishedBlogs,
        totalScormCourses: totalCourses,
        activeCourses,
        draftCourses,
        totalVideoCourses,
        activeVideoCourses,
        totalGameCourses,
        activeGameCourses,
        totalUsers,
        adminCount,
        managerCount,
        learnerCount,
        recentUploads,
      }),
    };
  } catch (error: any) {
    console.error("Get dashboard stats error:", error);
    return { success: false, error: error.message };
  }
}
