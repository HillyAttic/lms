"use server";

import { adminDb, FieldValue, Timestamp, serializeTimestamps } from "@/lib/firebase-admin";
import { canAccessAdminPanel } from "@/lib/roles";
import { resolveThumbnails } from "@/lib/storage-urls";
import crypto from "crypto";

const EXPIRY_DAYS = 15;

interface ExternalShareData {
  name: string;
  email?: string;
  mobile?: string;
  expirationDate?: string;
  courseIds: {
    scorm: Array<{ id: string; source?: string }>;
    video: string[];
    game: string[];
  };
}

function resolveExpirationDate(expirationDate: string | undefined, now: Date): Date {
  if (expirationDate === undefined) {
    return new Date(now.getTime() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  }

  if (typeof expirationDate !== "string") {
    throw new Error("Expiration date must be in YYYY-MM-DD format");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  if (!match) {
    throw new Error("Expiration date must be in YYYY-MM-DD format");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    throw new Error("Expiration date is invalid");
  }

  const expiresAt = new Date(0);
  expiresAt.setUTCFullYear(year, month - 1, day);
  expiresAt.setUTCHours(23, 59, 59, 999);

  if (expiresAt <= now) {
    throw new Error("Expiration date must be in the future");
  }

  return expiresAt;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Helper to verify admin role
async function verifyAdmin(adminUserId: string): Promise<boolean> {
  const adminDoc = await adminDb.doc(`users/${adminUserId}`).get();
  return adminDoc.exists && canAccessAdminPanel(adminDoc.data()?.role);
}

// Create a new external share link
export async function createExternalShare(data: ExternalShareData, adminUserId: string) {
  try {
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Validate: at least email or mobile
    if (!data.email && !data.mobile) {
      return { success: false, error: "At least email or mobile number is required" };
    }

    // Validate: at least one course selected
    const totalCourses =
      (data.courseIds?.scorm?.length || 0) +
      (data.courseIds?.video?.length || 0) +
      (data.courseIds?.game?.length || 0);
    if (totalCourses === 0) {
      return { success: false, error: "Please select at least one course" };
    }

    // Normalize scorm IDs - handle both string[] and object[] formats
    const normalizedScormIds = (data.courseIds?.scorm || []).map((item: any) =>
      typeof item === "string" ? item : item.id
    );

    const token = crypto.randomUUID();
    const now = new Date();
    const expiresAt = resolveExpirationDate(data.expirationDate, now);

    // Derive access types from selected courses
    const accessTypes: string[] = [];
    if (normalizedScormIds.length) accessTypes.push("scorm");
    if (data.courseIds?.video?.length) accessTypes.push("video");
    if (data.courseIds?.game?.length) accessTypes.push("game");

    const shareDoc = {
      name: data.name,
      email: data.email || null,
      mobile: data.mobile || null,
      accessTypes,
      courseIds: {
        scorm: normalizedScormIds,
        video: data.courseIds?.video || [],
        game: data.courseIds?.game || [],
      },
      token,
      createdBy: adminUserId,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: true,
    };

    const docRef = await adminDb.collection("external_shares").add(shareDoc);

    // Build the share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/${token}`;

    return {
      success: true,
      data: {
        id: docRef.id,
        ...shareDoc,
        createdAt: { seconds: Math.floor(now.getTime() / 1000), nanoseconds: 0 },
        expiresAt: { seconds: Math.floor(expiresAt.getTime() / 1000), nanoseconds: 0 },
        shareUrl,
      },
    };
  } catch (error: any) {
    console.error("Create external share error:", error);
    return { success: false, error: error.message };
  }
}

// Get paginated external shares for admin
export async function getExternalShares(
  page: number = 1,
  limit: number = 10,
  search?: string,
  adminUserId?: string
) {
  try {
    if (adminUserId) {
      const isAdmin = await verifyAdmin(adminUserId);
      if (!isAdmin) {
        return { success: false, error: "Admin access required" };
      }
    }

    const snapshot = await adminDb.collection("external_shares").get();
    let shares = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      shares = shares.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(searchLower) ||
          s.email?.toLowerCase().includes(searchLower) ||
          s.mobile?.includes(searchLower)
      );
    }

    // Sort by createdAt descending
    shares.sort((a: any, b: any) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    const total = shares.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = shares.slice(offset, offset + limit);

    return {
      success: true,
      data: serializeTimestamps(data),
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error("Get external shares error:", error);
    return { success: false, error: error.message };
  }
}

// Revoke an external share
export async function revokeExternalShare(shareId: string, adminUserId: string) {
  try {
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    await adminDb.doc(`external_shares/${shareId}`).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Revoke external share error:", error);
    return { success: false, error: error.message };
  }
}

// Delete an external share
export async function deleteExternalShare(shareId: string, adminUserId: string) {
  try {
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    await adminDb.doc(`external_shares/${shareId}`).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Delete external share error:", error);
    return { success: false, error: error.message };
  }
}

// Batch delete external shares
export async function batchDeleteExternalShares(shareIds: string[], adminUserId: string) {
  try {
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    const batch = adminDb.batch();
    shareIds.forEach((id) => {
      const ref = adminDb.doc(`external_shares/${id}`);
      batch.delete(ref);
    });
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error("Batch delete external shares error:", error);
    return { success: false, error: error.message };
  }
}

// Get external share by token (public, no auth)
export async function getExternalShareByToken(token: string) {
  try {
    const snapshot = await adminDb
      .collection("external_shares")
      .where("token", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: "Share link not found" };
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check if active
    if (!data.isActive) {
      return { success: false, error: "This share link has been revoked" };
    }

    // Check expiry
    const expiresAt = data.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      return { success: false, error: "This share link has expired" };
    }

    // Fetch the actual course details for the selected IDs
    const courseIds = data.courseIds || { scorm: [], video: [], game: [] };
    const courses: Record<string, any[]> = { scorm: [], video: [], game: [] };

    // Fetch SCORM courses - check both courses and repository collections
    if (courseIds.scorm?.length) {
      for (const item of courseIds.scorm) {
        // Handle both string IDs and object format { id, source }
        const id = typeof item === "string" ? item : item.id;
        const source = typeof item === "object" ? item.source : null;

        // If source is known, try that collection first
        if (source === "repository") {
          const courseDoc = await adminDb.doc(`repository/${id}`).get();
          if (courseDoc.exists) {
            courses.scorm.push({
              id: courseDoc.id,
              ...courseDoc.data(),
              title: courseDoc.data()?.title || courseDoc.data()?.name || "Untitled course",
              source: "repository",
            });
            continue;
          }
        } else if (source === "courses") {
          const courseDoc = await adminDb.doc(`courses/${id}`).get();
          if (courseDoc.exists) {
            courses.scorm.push({
              id: courseDoc.id,
              ...courseDoc.data(),
              title: courseDoc.data()?.title || courseDoc.data()?.name || "Untitled course",
              source: "courses",
            });
            continue;
          }
        }

        // Fallback: try both collections
        let courseDoc = await adminDb.doc(`courses/${id}`).get();
        if (courseDoc.exists) {
          courses.scorm.push({
            id: courseDoc.id,
            ...courseDoc.data(),
            title: courseDoc.data()?.title || courseDoc.data()?.name || "Untitled course",
            source: "courses",
          });
          continue;
        }
        courseDoc = await adminDb.doc(`repository/${id}`).get();
        if (courseDoc.exists) {
          courses.scorm.push({
            id: courseDoc.id,
            ...courseDoc.data(),
            title: courseDoc.data()?.title || courseDoc.data()?.name || "Untitled course",
            source: "repository",
          });
        }
      }
    }

    // Fetch Video courses
    if (courseIds.video?.length) {
      for (const id of courseIds.video) {
        const courseDoc = await adminDb.doc(`video_courses/${id}`).get();
        if (courseDoc.exists) {
          courses.video.push({
            id: courseDoc.id,
            ...courseDoc.data(),
            title: courseDoc.data()?.title || courseDoc.data()?.name || "Untitled course",
          });
        }
      }
    }

    // Fetch Game courses
    if (courseIds.game?.length) {
      for (const id of courseIds.game) {
        const courseDoc = await adminDb.doc(`game_courses/${id}`).get();
        if (courseDoc.exists) {
          courses.game.push({
            id: courseDoc.id,
            ...courseDoc.data(),
            title: courseDoc.data()?.title || courseDoc.data()?.name || "Untitled course",
          });
        }
      }
    }

    return {
      success: true,
      data: serializeTimestamps({
        id: doc.id,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        accessTypes: data.accessTypes,
        expiresAt: data.expiresAt,
        courses: {
          scorm: await resolveThumbnails(courses.scorm),
          video: await resolveThumbnails(courses.video),
          game: await resolveThumbnails(courses.game),
        },
      }),
    };
  } catch (error: any) {
    console.error("Get external share by token error:", error);
    return { success: false, error: error.message };
  }
}

// Get all courses for selection in the create form
export async function getCoursesForSelection(adminUserId: string) {
  try {
    const isAdmin = await verifyAdmin(adminUserId);
    if (!isAdmin) {
      return { success: false, error: "Admin access required" };
    }

    // Fetch all content from each collection
    // SCORM: check both "courses" and "repository" collections
    const [coursesSnapshot, repositorySnapshot, videoSnapshot, gameSnapshot] = await Promise.all([
      adminDb.collection("courses").get(),
      adminDb.collection("repository").get(),
      adminDb.collection("video_courses").get(),
      adminDb.collection("game_courses").get(),
    ]);

    // SCORM items from courses collection
    const scormCourses = coursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || doc.data().name || "Untitled",
      thumbnailUrl: doc.data().thumbnailUrl || null,
      source: "courses" as const,
    }));

    // SCORM items from repository collection
    const scormRepository = repositorySnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().name || doc.data().title || "Untitled",
      thumbnailUrl: doc.data().thumbnailUrl || null,
      source: "repository" as const,
    }));

    // Combine all SCORM items
    const scorm = [...scormCourses, ...scormRepository];

    const video = videoSnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || doc.data().name || "Untitled",
      thumbnailUrl: doc.data().thumbnailUrl || null,
    }));

    const game = gameSnapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title || doc.data().name || "Untitled",
      thumbnailUrl: doc.data().thumbnailUrl || null,
    }));

    return {
      success: true,
      data: { scorm, video, game },
    };
  } catch (error: any) {
    console.error("Get courses for selection error:", error);
    return { success: false, error: error.message };
  }
}
