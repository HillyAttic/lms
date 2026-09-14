"use server";

import { adminDb, adminStorage, FieldValue, Timestamp, serializeTimestamps } from "@/lib/firebase-admin";
import { canAccessAdminPanel } from "@/lib/roles";
import { resolveThumbnails, resolveThumbnailUrl } from "@/lib/storage-urls";
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
  if (!canAccessAdminPanel(userData?.role)) {
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
  thumbnailUrl?: string | null,
  courseId?: string
) {
  try {
    if (!userId) throw new Error("User ID is required");
    if (!title?.trim()) throw new Error("Title is required");
    if (gameType === "uploaded" && !gameZipPath) throw new Error("Game ZIP path is required");
    if (gameType === "url" && !gameUrl?.trim()) throw new Error("Game URL is required");

    await verifyAdmin(userId);

    // Callers that already uploaded the ZIP supply the ID so the extracted path
    // `games/{courseId}/extracted` matches the document deleteGameCourse cleans up.
    const resolvedCourseId = courseId || `game_${Date.now()}`;
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
            path: `games/${resolvedCourseId}/extracted/${filename}`,
            content: null as any, // will be loaded below
          });
        }
      });

      // Load content for each file
      for (const file of extractedFiles) {
        const relativePath = file.path.replace(`games/${resolvedCourseId}/extracted/`, "");
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

      // Detect entry point, kept relative to the extracted root so the launch
      // route can still serve it when it sits inside a subdirectory.
      const indexFiles = extractedFiles.filter((f) =>
        f.path.endsWith("/index.html") || f.path.endsWith("/index.htm")
      );
      if (indexFiles.length > 0) {
        gameEntryFile =
          indexFiles[0].path.replace(`games/${resolvedCourseId}/extracted/`, "") ||
          "index.html";
      }

      gameStoragePath = `games/${resolvedCourseId}/extracted`;
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

    await adminDb.collection(COLLECTION).doc(resolvedCourseId).set(courseData);

    revalidatePath("/admin/game-courses");
    revalidatePath("/admin/repository");
    revalidatePath("/repository");
    revalidatePath("/admin");

    return {
      success: true,
      data: serializeTimestamps({ id: resolvedCourseId, ...courseData }),
    };
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

    // Signed after the sort above, which reads Timestamp.seconds directly.
    return {
      success: true,
      data: serializeTimestamps(await resolveThumbnails(paginatedCourses)),
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
    const data = doc.data()!;
    return {
      success: true,
      data: serializeTimestamps({
        id: doc.id,
        ...data,
        thumbnailUrl: await resolveThumbnailUrl(data.thumbnailUrl),
      }),
    };
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
