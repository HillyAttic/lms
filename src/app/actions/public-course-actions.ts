"use server";

import { revalidatePath } from "next/cache";
import { adminAuth, adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";
import { canAccessAdminPanel } from "@/lib/roles";
import type { CategorySlug } from "@/types/CategoryType";

const COLLECTION = "public_courses";
const THUMBNAIL_PATH = "public-courses/thumbnails";

/** Shape of a `public_courses` document as the public site consumes it. */
export type PublicCourse = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  shortDescription?: string;
  instructor?: { name?: string };
  price?: number;
  discountPrice?: number;
  totalLearners?: number;
  category?: CategorySlug | "";
  rating?: number;
  /** How many learners the `rating` average is drawn from. */
  ratingCount?: number;
  /** Repository item this course launches. */
  contentId?: string;
};

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
        category: data.category || "",
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

/** The public detail page is keyed by slug — see `/courses/[slug]`. */
export async function getPublicCourseBySlug(slug: string) {
  try {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("slug", "==", slug)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return { success: false, error: "Course not found" };
    }
    const doc = snapshot.docs[0];
    return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
  } catch (error: any) {
    console.error("Get public course by slug error:", error);
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
    category?: CategorySlug | "";
    /** Repository item this course launches — see `contentId` on the doc. */
    contentId?: string;
  },
  userId: string
) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
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
      category: data.category || "",
      contentId: data.contentId || "",
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
    category?: CategorySlug | "";
    /** Repository item this course launches — see `contentId` on the doc. */
    contentId?: string;
  },
  userId: string
) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
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
    if (data.category !== undefined) updateData.category = data.category;
    if (data.contentId !== undefined) updateData.contentId = data.contentId;

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
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
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
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
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
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
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

/**
 * A rating targets a `public_courses` doc when one exists, otherwise the
 * repository upload behind the slug — the same two-way fallback the detail page
 * and the launch page already use.
 */
async function resolveRatingTarget(slug: string) {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (!snapshot.empty) {
    return { kind: "course" as const, id: snapshot.docs[0].id };
  }
  const item = await adminDb.collection("repository").doc(slug).get();
  return item.exists ? { kind: "content" as const, id: slug } : null;
}

async function aggregateRating(kind: "course" | "content", id: string) {
  const field = kind === "course" ? "courseId" : "contentId";
  const ratings = await adminDb
    .collection("ratings")
    .where(field, "==", id)
    .get();
  if (ratings.empty) return { average: 0, count: 0 };

  const average =
    ratings.docs.reduce((sum, doc) => sum + (doc.data().value || 0), 0) /
    ratings.size;

  return { average: Math.round(average * 10) / 10, count: ratings.size };
}

/** Writes the aggregate back onto the rated doc so list cards stay cheap. */
async function publishRating(
  kind: "course" | "content",
  id: string,
  aggregate: { average: number; count: number }
) {
  await adminDb
    .collection(kind === "course" ? COLLECTION : "repository")
    .doc(id)
    .set(
      {
        rating: aggregate.average,
        ratingCount: aggregate.count,
        ratingUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/**
 * The written half of a rating. Passing `comment` replaces the learner's
 * existing review; omitting it leaves any review they already wrote intact —
 * which is what lets a bare star click rate without wiping their text.
 */
export async function submitRating(
  slug: string,
  value: number,
  idToken: string,
  comment?: string
) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return { success: false, error: "Rating must be a whole number from 1 to 5" };
  }
  const review = comment?.trim();
  if (review && review.length > 1000) {
    return { success: false, error: "Reviews are limited to 1000 characters" };
  }

  try {
    // Server Functions are POST-reachable, so the learner's identity is taken
    // from the verified token rather than trusted from the caller.
    const { uid: userId } = await adminAuth.verifyIdToken(idToken);

    const target = await resolveRatingTarget(slug);
    if (!target) return { success: false, error: "Course not found" };

    // Reviews are attributed, so the name is read server-side from the profile
    // the learner cannot edit through this action.
    const profile = await adminDb.doc(`users/${userId}`).get();
    const userName = profile.data()?.displayName || "Learner";

    // One rating per learner, per course: re-clicking a star replaces it.
    await adminDb
      .collection("ratings")
      .doc(`${userId}_${target.id}`)
      .set(
        {
          value,
          userId,
          userName,
          ...(review !== undefined ? { comment: review } : {}),
          [target.kind === "course" ? "courseId" : "contentId"]: target.id,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    const aggregate = await aggregateRating(target.kind, target.id);
    await publishRating(target.kind, target.id, aggregate);

    // Without this the action's response carries no fresh RSC payload, so the
    // stars and the review list would keep the figures they were rendered with.
    revalidatePath(`/courses/${slug}`);

    return { success: true, data: aggregate };
  } catch (error: any) {
    console.error("Submit rating error:", error);
    return { success: false, error: error.message };
  }
}

export type CourseReview = {
  userId: string;
  userName: string;
  value: number;
  comment?: string;
  updatedAt: { seconds: number; nanoseconds: number } | null;
};

/**
 * Reviews shown under a course. `updatedAt` is stamped on every write, so
 * closing the keys and reversing gives newest-first without a composite index.
 */
export async function getCourseReviews(slug: string) {
  try {
    const target = await resolveRatingTarget(slug);
    if (!target) return { success: true, data: [] as CourseReview[] };

    const snapshot = await adminDb
      .collection("ratings")
      .where(target.kind === "course" ? "courseId" : "contentId", "==", target.id)
      .get();

    const data = snapshot.docs
      .map((doc) => {
        const rating = doc.data();
        return {
          userId: rating.userId || "",
          userName: rating.userName || "Learner",
          value: rating.value || 0,
          // Legacy docs predate `userName`; a blank review still counts as a star.
          comment: typeof rating.comment === "string" ? rating.comment : undefined,
          updatedAt: rating.updatedAt || null,
        };
      })
      // Reviews are trimmed on the way in, but a whitespace-only one written
      // before that guard existed would still render as an empty card.
      .filter((review) => review.comment?.trim())
      .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));

    return { success: true, data: serializeTimestamps(data) as CourseReview[] };
  } catch (error: any) {
    console.error("Get course reviews error:", error);
    return { success: false, error: error.message, data: [] as CourseReview[] };
  }
}
