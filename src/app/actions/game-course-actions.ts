"use server";

import { adminDb, adminStorage, FieldValue, Timestamp } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import JSZip from "jszip";

const COLLECTION = "game_courses";

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

// Upload game course
export async function uploadGameCourse(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const gameType = formData.get("gameType") as "uploaded" | "url";
    const file = formData.get("file") as File | null;
    const gameUrl = formData.get("gameUrl") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = parseInt(formData.get("duration") as string) || 0;
    const categories = (formData.get("categories") as string || "").split(",").map(c => c.trim()).filter(Boolean);
    const tags = (formData.get("tags") as string || "").split(",").map(t => t.trim()).filter(Boolean);
    const thumbnail = formData.get("thumbnail") as File | null;

    if (!userId) throw new Error("User ID is required");
    if (!title?.trim()) throw new Error("Title is required");
    if (gameType === "uploaded" && !file) throw new Error("Game file is required");
    if (gameType === "url" && !gameUrl?.trim()) throw new Error("Game URL is required");

    await verifyAdmin(userId);

    const courseId = `game_${Date.now()}`;
    const bucket = adminStorage.bucket();

    let gameStoragePath = "";
    let gameEntryFile = "index.html";

    if (gameType === "uploaded" && file) {
      // Upload ZIP file
      const zipPath = `games/${courseId}/source.zip`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const zipRef = bucket.file(zipPath);

      await zipRef.save(buffer, {
        metadata: {
          contentType: "application/zip",
        },
      });

      // Extract ZIP contents
      const zip = await JSZip.loadAsync(buffer);
      const extractedFiles: { path: string; buffer: Buffer }[] = [];

      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async("nodebuffer");
          extractedFiles.push({
            path: `games/${courseId}/extracted/${filename}`,
            buffer: content,
          });
        }
      }

      // Upload extracted files in batches
      const BATCH_SIZE = 20;
      for (let i = 0; i < extractedFiles.length; i += BATCH_SIZE) {
        const batch = extractedFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (file) => {
            const fileRef = bucket.file(file.path);
            await fileRef.save(file.buffer);
          })
        );
      }

      // Detect entry point
      const indexFiles = extractedFiles.filter((f) =>
        f.path.endsWith("/index.html") || f.path.endsWith("/index.htm")
      );
      if (indexFiles.length > 0) {
        gameEntryFile = indexFiles[0].path.split("/").pop() || "index.html";
      }

      gameStoragePath = `games/${courseId}/extracted`;
    }

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
      gameUrl: gameType === "url" ? gameUrl.trim() : null,
      gameStoragePath,
      gameEntryFile,
      gameType,
      categories,
      tags,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
    };

    await adminDb.collection(COLLECTION).doc(courseId).set(courseData);

    revalidatePath("/admin/game-courses");
    revalidatePath("/admin");

    return { success: true, data: { id: courseId, ...courseData } };
  } catch (error: any) {
    console.error("Error uploading game course:", error);
    return { success: false, error: error.message };
  }
}

// Get paginated game courses
export async function getGameCoursesPaginated(
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
    console.error("Error fetching game courses:", error);
    return { success: false, error: error.message, data: [], total: 0, page, limit, totalPages: 0 };
  }
}

// Get game course by ID
export async function getGameCourseById(courseId: string) {
  try {
    const doc = await adminDb.collection(COLLECTION).doc(courseId).get();
    if (!doc.exists) {
      return { success: false, error: "Course not found" };
    }
    return { success: true, data: { id: doc.id, ...doc.data() } };
  } catch (error: any) {
    console.error("Error fetching game course:", error);
    return { success: false, error: error.message };
  }
}

// Update game course
export async function updateGameCourse(courseId: string, userId: string, data: any) {
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

    revalidatePath("/admin/game-courses");
    revalidatePath(`/admin/game-courses/${courseId}`);
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating game course:", error);
    return { success: false, error: error.message };
  }
}

// Delete game course
export async function deleteGameCourse(courseId: string, userId: string) {
  try {
    await verifyAdmin(userId);

    // Delete from Firestore
    await adminDb.collection(COLLECTION).doc(courseId).delete();

    // Delete storage files
    const bucket = adminStorage.bucket();
    try {
      await bucket.deleteFiles({ prefix: `games/${courseId}/` });
    } catch (e) {}
    try {
      await bucket.deleteFiles({ prefix: `thumbnails/${courseId}/` });
    } catch (e) {}

    revalidatePath("/admin/game-courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting game course:", error);
    return { success: false, error: error.message };
  }
}

// Batch delete game courses
export async function batchDeleteGameCourses(courseIds: string[], userId: string) {
  try {
    await verifyAdmin(userId);

    const bucket = adminStorage.bucket();

    for (const courseId of courseIds) {
      // Delete from Firestore
      await adminDb.collection(COLLECTION).doc(courseId).delete();

      // Delete storage files
      try {
        await bucket.deleteFiles({ prefix: `games/${courseId}/` });
      } catch (e) {}
      try {
        await bucket.deleteFiles({ prefix: `thumbnails/${courseId}/` });
      } catch (e) {}
    }

    revalidatePath("/admin/game-courses");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error batch deleting game courses:", error);
    return { success: false, error: error.message };
  }
}
