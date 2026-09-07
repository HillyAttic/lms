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

// Upload video course
export async function uploadVideoCourse(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string) || 0;
    const categories = (formData.get("categories") as string || "").split(",").map(c => c.trim()).filter(Boolean);
    const tags = (formData.get("tags") as string || "").split(",").map(t => t.trim()).filter(Boolean);
    const thumbnail = formData.get("thumbnail") as File | null;

    if (!userId) throw new Error("User ID is required");
    if (!file) throw new Error("Video file is required");
    if (!title?.trim()) throw new Error("Title is required");

    await verifyAdmin(userId);

    const courseId = `video_${Date.now()}`;
    const fileExtension = file.name.split(".").pop() || "mp4";
    const videoPath = `videos/${courseId}/video.${fileExtension}`;

    // Upload video file to Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(videoPath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type || `video/${fileExtension}`,
      },
    });

    // Generate signed URL for video playback
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    // Upload thumbnail if provided
    let thumbnailUrl = null;
    if (thumbnail) {
      const thumbExt = thumbnail.name.split(".").pop() || "jpg";
      const thumbPath = `thumbnails/${courseId}/thumbnail.${thumbExt}`;
      const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer());
      const thumbRef = bucket.file(thumbPath);

      await thumbRef.save(thumbBuffer, {
        metadata: {
          contentType: thumbnail.type || `image/${thumbExt}`,
        },
      });

      const [thumbUrl] = await thumbRef.getSignedUrl({
        action: "read",
        expires: "2037-12-31",
      });
      thumbnailUrl = thumbUrl;
    }

    // Create Firestore document
    const courseData = {
      title: title.trim(),
      description: description?.trim() || "",
      duration,
      status: "draft",
      thumbnailUrl,
      videoUrl: signedUrl,
      videoStoragePath: videoPath,
      videoMimeType: file.type || `video/${fileExtension}`,
      videoFileSize: file.size,
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
    console.error("Error uploading video course:", error);
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
    return { success: false, error: error.message };
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
