"use server";

import { adminDb, adminStorage, FieldValue, Timestamp } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

const COLLECTION = "video_courses";

// Verify admin role
async function verifyAdmin(userId: string) {
  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User not found");
  }
  const userData = userDoc.data();
  if (userData?.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return userData;
}

/**
 * Process video course from Firebase Storage
 * Video must already be uploaded directly to storage via signed URL
 */
export async function processVideoCourse(
  userId: string,
  videoStoragePath: string,
  title: string,
  description: string,
  duration: number,
  categories: string[],
  tags: string[],
  videoMimeType: string,
  videoFileSize: number,
  thumbnailUrl?: string | null
) {
  try {
    if (!userId) throw new Error("User ID is required");
    if (!videoStoragePath) throw new Error("Video storage path is required");
    if (!title?.trim()) throw new Error("Title is required");

    await verifyAdmin(userId);

    const courseId = `video_${Date.now()}`;

    // Generate signed URL for video playback
    const bucket = adminStorage.bucket();
    const [signedUrl] = await bucket.file(videoStoragePath).getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    // Create Firestore document
    const courseData = {
      title: title.trim(),
      description: description?.trim() || "",
      duration,
      status: "draft",
      thumbnailUrl: thumbnailUrl || null,
      videoUrl: signedUrl,
      videoStoragePath,
      videoMimeType,
      videoFileSize,
      categories,
      tags,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
    };

    await adminDb.collection(COLLECTION).doc(courseId).set(courseData);

    revalidatePath("/admin/video-courses");
    revalidatePath("/admin");

    return { success: true, data: { id: courseId, ...courseData } };
  } catch (error: any) {
    console.error("Error processing video course:", error);
    return { success: false, error: error.message };
  }
}

// Get paginated video courses
export async function getVideoCoursesPaginated(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status: string = "all",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  try {
    const snapshot = await adminDb.collection(COLLECTION).get();
    let courses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (course: any) =>
          course.title?.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (status !== "all") {
      courses = courses.filter((course: any) => course.status === status);
    }

    // Sort
    courses.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aVal = aVal?.seconds || 0;
        bVal = bVal?.seconds || 0;
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCourses = courses.slice(startIndex, startIndex + limit);

    return {
      success: true,
      data: paginatedCourses,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error("Error fetching video courses:", error);
    return { success: false, error: error.message, data: [], total: 0, page, limit, totalPages: 0 };
  }
}

// Get video course by ID
export async function getVideoCourseById(courseId: string) {
  try {
    const doc = await adminDb.collection(COLLECTION).doc(courseId).get();
    if (!doc.exists) {
      return { success: false, error: "Course not found" };
    }
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error: any) {
    console.error("Error fetching video course:", error);
    return { success: true, error: error.message };
  }
}

// Update video course
export async function updateVideoCourse(courseId: string, userId: string, data: any) {
  try {
    await verifyAdmin(userId);

    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb.collection(COLLECTION).doc(courseId).update(updateData);

    revalidatePath("/admin/video-courses");
    revalidatePath(`/admin/video-courses/${courseId}`);
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating video course:", error);
    return { success: false, error: error.message };
  }
}

// Delete video course
export async function deleteVideoCourse(courseId: string, userId: string) {
  try {
    await verifyAdmin(userId);

    // Delete from Firestore
    await adminDb.collection(COLLECTION).doc(courseId).delete();

    // Delete storage files
    const bucket = adminStorage.bucket();
    try {
      await bucket.deleteFiles({ prefix: `videos/${courseId}/` });
    } catch (e) {
      // Files might not exist
    }
    try {
      await bucket.deleteFiles({ prefix: `thumbnails/${courseId}/` });
    } catch (e) {
      // Files might not exist
    }

    revalidatePath("/admin/video-courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting video course:", error);
    return { success: false, error: error.message };
  }
}

// Batch delete video courses
export async function batchDeleteVideoCourses(courseIds: string[], userId: string) {
  try {
    await verifyAdmin(userId);

    const bucket = adminStorage.bucket();

    for (const courseId of courseIds) {
      // Delete from Firestore
      await adminDb.collection(COLLECTION).doc(courseId).delete();

      // Delete storage files
      try {
        await bucket.deleteFiles({ prefix: `videos/${courseId}/` });
      } catch (e) {}
      try {
        await bucket.deleteFiles({ prefix: `thumbnails/${courseId}/` });
      } catch (e) {}
    }

    revalidatePath("/admin/video-courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error batch deleting video courses:", error);
    return { success: false, error: error.message };
  }
}
