"use server";

import { adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";

const COLLECTION = "public_courses";
const THUMBNAIL_PATH = "public-courses/thumbnails";

export async function getPublicCourses() {
  const snapshot = await adminDb.collection(COLLECTION).get();
  return serializeTimestamps(
    snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        _id: doc.id, // Map to CourseType._id
        title: data.title,
        shortDescription: data.shortDescription || "",
        thumbnail: data.thumbnailUrl || "", // Map to CourseType.thumbnail
        instructor: data.instructor || { name: "" },
        totalLearners: data.totalLearners || 0,
        isCertificationProvide: data.isCertificationProvide || false,
        price: data.price || 0,
        discountPrice: data.discountPrice || 0,
        status: data.status || "Ongoing",
        slug: { current: data.slug || "" }, // Map to CourseType.slug.current
        level: data.level || "Beginner",
        overview: data.overview || [],
        duration: data.duration || 0,
        lessonsCount: data.lessonsCount || 0,
      };
    })
  );
}

export async function getPublicCoursesPaginated(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  try {
    // Get all courses for search (Firestore doesn't support full-text search)
    const snapshot = await adminDb.collection(COLLECTION).get();
    let courses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        shortDescription: data.shortDescription || "",
        thumbnailUrl: data.thumbnailUrl || null,
        instructor: data.instructor || { name: "" },
        price: data.price || 0,
        discountPrice: data.discountPrice || 0,
        status: data.status || "Ongoing",
        level: data.level || "Beginner",
        duration: data.duration || 0,
        lessonsCount: data.lessonsCount || 0,
        isCertificationProvide: data.isCertificationProvide || false,
        totalLearners: data.totalLearners || 0,
        createdAt: data.createdAt,
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(
        (c: any) =>
          c.title?.toLowerCase().includes(searchLower) ||
          c.shortDescription?.toLowerCase().includes(searchLower) ||
          c.instructor?.name?.toLowerCase().includes(searchLower)
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
    console.error("Get public courses paginated error:", error);
    return { success: false, error: error.message };
  }
}

export async function getPublicCourseById(courseId: string) {
  try {
    const doc = await adminDb.doc(`${COLLECTION}/${courseId}`).get();
    if (!doc.exists) {
      return { success: false, error: "Course not found" };
    }
    return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
  } catch (error: any) {
    console.error("Get public course error:", error);
    return { success: false, error: error.message };
  }
}

export async function createPublicCourse(
  data: {
    title: string;
    shortDescription?: string;
    instructorName?: string;
    price?: number;
    discountPrice?: number;
    status?: "Ongoing" | "Completed";
    slug?: string;
    level?: string;
    overview?: string[];
    duration?: number;
    lessonsCount?: number;
    isCertificationProvide?: boolean;
    totalLearners?: number;
  },
  userId: string
) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Generate slug from title if not provided
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const courseData = {
      title: data.title,
      shortDescription: data.shortDescription || "",
      thumbnailUrl: null,
      instructor: { name: data.instructorName || "" },
      totalLearners: data.totalLearners || 0,
      isCertificationProvide: data.isCertificationProvide || false,
      price: data.price || 0,
      discountPrice: data.discountPrice || 0,
      status: data.status || "Ongoing",
      slug,
      level: data.level || "Beginner",
      overview: data.overview || [],
      duration: data.duration || 0,
      lessonsCount: data.lessonsCount || 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection(COLLECTION).add(courseData);

    return { success: true, data: { id: docRef.id, ...courseData } };
  } catch (error: any) {
    console.error("Create public course error:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePublicCourse(
  courseId: string,
  data: {
    title?: string;
    shortDescription?: string;
    instructorName?: string;
    price?: number;
    discountPrice?: number;
    status?: "Ongoing" | "Completed";
    slug?: string;
    level?: string;
    overview?: string[];
    duration?: number;
    lessonsCount?: number;
    isCertificationProvide?: boolean;
    totalLearners?: number;
  },
  userId: string
) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Only update provided fields
    if (data.title !== undefined) updateData.title = data.title;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.instructorName !== undefined) updateData.instructor = { name: data.instructorName };
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.overview !== undefined) updateData.overview = data.overview;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.lessonsCount !== undefined) updateData.lessonsCount = data.lessonsCount;
    if (data.isCertificationProvide !== undefined) updateData.isCertificationProvide = data.isCertificationProvide;
    if (data.totalLearners !== undefined) updateData.totalLearners = data.totalLearners;

    await adminDb.doc(`${COLLECTION}/${courseId}`).update(updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Update public course error:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePublicCourse(courseId: string, userId: string) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Delete course document
    await adminDb.doc(`${COLLECTION}/${courseId}`).delete();

    // Delete thumbnail from Storage
    const bucket = adminStorage.bucket();
    const thumbPrefix = `${THUMBNAIL_PATH}/${courseId}`;
    const [thumbFiles] = await bucket.getFiles({ prefix: thumbPrefix });
    await Promise.all(thumbFiles.map((f) => f.delete()));

    return { success: true };
  } catch (error: any) {
    console.error("Delete public course error:", error);
    return { success: false, error: error.message };
  }
}

export async function batchDeletePublicCourses(courseIds: string[], userId: string) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const bucket = adminStorage.bucket();

    for (const courseId of courseIds) {
      // Delete course document
      await adminDb.doc(`${COLLECTION}/${courseId}`).delete();

      // Delete thumbnail files
      const thumbPrefix = `${THUMBNAIL_PATH}/${courseId}`;
      const [thumbFiles] = await bucket.getFiles({ prefix: thumbPrefix });
      await Promise.all(thumbFiles.map((f) => f.delete()));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Batch delete public courses error:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadPublicCourseThumbnail(
  courseId: string,
  file: File,
  userId: string
) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const bucket = adminStorage.bucket();
    const fileExtension = file.name.split(".").pop() || "jpg";
    const filePath = `${THUMBNAIL_PATH}/${courseId}/thumbnail.${fileExtension}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Storage
    await bucket.file(filePath).save(buffer, {
      contentType: file.type,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // Get signed URL (long-lived)
    const [signedUrl] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    // Update course document with thumbnail URL
    await adminDb.doc(`${COLLECTION}/${courseId}`).update({
      thumbnailUrl: signedUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { thumbnailUrl: signedUrl } };
  } catch (error: any) {
    console.error("Upload public course thumbnail error:", error);
    return { success: false, error: error.message };
  }
}
