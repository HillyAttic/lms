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

/**
 * Process game course from Firebase Storage
 * ZIP file must already be uploaded directly to storage via signed URL
 */
export async function processGameCourse(
  userId: string,
  gameType: "uploaded" | "url",
  gameZipPath: string | null,
  gameUrl: string,
  title: string,
  description: string,
  duration: number,
  categories: string[],
  tags: string[],
  thumbnailUrl?: string | null
) {
  try {
    if (!userId) throw new Error("User ID is required");
    if (!title?.trim()) throw new Error("Title is required");
    if (gameType === "uploaded" && !gameZipPath) throw new Error("Game ZIP path is required");
    if (gameType === "url" && !gameUrl?.trim()) throw new Error("Game URL is required");

    await verifyAdmin(userId);

    const courseId = `game_${Date.now()}`;
    const bucket = adminStorage.bucket();

    let gameStoragePath = "";
    let gameEntryFile = "index.html";

    if (gameType === "uploaded" && gameZipPath) {
      // Download ZIP from Firebase Storage
      const [fileBuffer] = await bucket.file(gameZipPath).download();

      // Extract ZIP contents
      const zip = await JSZip.loadAsync(fileBuffer);
      const extractedFiles: { path: string; content: Uint8Array }[] = [];

      zip.forEach((filename, zipEntry) => {
        if (!zipEntry.dir) {
          extractedFiles.push({
            path: `games/${courseId}/extracted/${filename}`,
            content: null as any, // will be loaded below
          });
        }
      });

      // Load content for each file
      for (const file of extractedFiles) {
        const relativePath = file.path.replace(`games/${courseId}/extracted/`, "");
        const zipEntry = zip.file(relativePath);
        if (zipEntry) {
          file.content = await zipEntry.async("uint8array");
        }
      }

      // Upload extracted files in batches
      const BATCH_SIZE = 20;
      for (let i = 0; i < extractedFiles.length; i += BATCH_SIZE) {
        const batch = extractedFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (file) => {
            if (file.content) {
              const fileRef = bucket.file(file.path);
              await fileRef.save(Buffer.from(file.content));
            }
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

    // Create Firestore document
    const courseData = {
      title: title.trim(),
      description: description?.trim() || "",
      duration,
      status: "draft",
      thumbnailUrl: thumbnailUrl || null,
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
    console.error("Error processing game course:", error);
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
