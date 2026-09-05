"use server";

import { adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";

export async function getCourses() {
  const snapshot = await adminDb.collection("courses").get();
  return serializeTimestamps(snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })));
}

export async function getActiveCourses() {
  const snapshot = await adminDb
    .collection("courses")
    .where("status", "==", "active")
    .get();
  return serializeTimestamps(snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })));
}

export async function getCourseById(courseId: string) {
  try {
    const doc = await adminDb.doc(`courses/${courseId}`).get();
    if (!doc.exists) {
      return { success: false, error: "Course not found" };
    }
    return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
  } catch (error: any) {
    console.error("Get course error:", error);
    return { success: false, error: error.message };
  }
}

export async function getCoursesPaginated(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  try {
    // Get all courses for search (Firestore doesn't support full-text search)
    const snapshot = await adminDb.collection("courses").get();
    let courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status && status !== "all") {
      courses = courses.filter((c: any) => c.status === status);
    }

    // Apply sorting
    courses.sort((a: any, b: any) => {
      const aVal = a[sortBy] || "";
      const bVal = b[sortBy] || "";
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = courses.slice(offset, offset + limit);

    return {
      success: true,
      data: serializeTimestamps(data),
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error("Get courses paginated error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCourseThumbnail(courseId: string, thumbnailUrl: string) {
  try {
    await adminDb.doc(`courses/${courseId}`).update({
      thumbnailUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Update course thumbnail error:", error);
    return { success: false, error: error.message };
  }
}

export async function batchDeleteCourses(courseIds: string[], userId: string) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const bucket = adminStorage.bucket();

    for (const courseId of courseIds) {
      // Delete course document
      await adminDb.doc(`courses/${courseId}`).delete();

      // Delete Storage files
      const scormPrefix = `scorm/${courseId}`;
      const [scormFiles] = await bucket.getFiles({ prefix: scormPrefix });
      await Promise.all(scormFiles.map((f) => f.delete()));

      // Delete thumbnail files
      const thumbPrefix = `thumbnails/${courseId}`;
      const [thumbFiles] = await bucket.getFiles({ prefix: thumbPrefix });
      await Promise.all(thumbFiles.map((f) => f.delete()));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Batch delete courses error:", error);
    return { success: false, error: error.message };
  }
}
