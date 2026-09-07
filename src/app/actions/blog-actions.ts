"use server";

import { adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";

export async function getBlogById(blogId: string) {
  try {
    const doc = await adminDb.doc(`blogs/${blogId}`).get();
    if (!doc.exists) {
      return { success: false, error: "Blog not found" };
    }
    return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
  } catch (error: any) {
    console.error("Get blog error:", error);
    return { success: false, error: error.message };
  }
}

export async function getBlogsPaginated(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  topic?: string,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
) {
  try {
    const snapshot = await adminDb.collection("blogs").get();
    let blogs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      blogs = blogs.filter(
        (b: any) =>
          b.title?.toLowerCase().includes(searchLower) ||
          b.shortDescription?.toLowerCase().includes(searchLower) ||
          b.topic?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status && status !== "all") {
      blogs = blogs.filter((b: any) => b.status === status);
    }

    // Apply topic filter
    if (topic && topic !== "all") {
      blogs = blogs.filter((b: any) => b.topic === topic);
    }

    // Apply sorting
    blogs.sort((a: any, b: any) => {
      const aVal = a[sortBy] || "";
      const bVal = b[sortBy] || "";
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "desc" ? -comparison : comparison;
    });

    const total = blogs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = blogs.slice(offset, offset + limit);

    return {
      success: true,
      data: serializeTimestamps(data),
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error("Get blogs paginated error:", error);
    return { success: false, error: error.message };
  }
}

export async function getPublishedBlogs(limit: number = 6) {
  try {
    const snapshot = await adminDb
      .collection("blogs")
      .where("status", "==", "published")
      .get();

    let blogs = snapshot.docs.map((doc) => ({
      _id: doc.id,
      ...doc.data(),
    }));

    // Sort by date descending
    blogs.sort((a: any, b: any) => {
      const dateA = a.date || "";
      const dateB = b.date || "";
      return dateB < dateA ? -1 : dateB > dateA ? 1 : 0;
    });

    return {
      success: true,
      data: serializeTimestamps(blogs.slice(0, limit)),
    };
  } catch (error: any) {
    console.error("Get published blogs error:", error);
    return { success: false, error: error.message };
  }
}

export async function createBlog(data: {
  title: string;
  shortDescription: string;
  content: any[];
  topic: string;
  tags: string[];
  featureImage: string;
  author: { name: string; photo: string; title: string };
  status: "published" | "draft";
  userId: string;
}) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${data.userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const blogData = {
      title: data.title,
      slug: { current: slug },
      shortDescription: data.shortDescription,
      content: data.content || [],
      topic: data.topic,
      tags: data.tags,
      featureImage: data.featureImage || "",
      author: data.author,
      date: new Date().toISOString().split("T")[0],
      status: data.status,
      createdBy: data.userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("blogs").add(blogData);

    return { success: true, data: { id: docRef.id, ...blogData } };
  } catch (error: any) {
    console.error("Create blog error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBlog(
  blogId: string,
  userId: string,
  data: {
    title?: string;
    shortDescription?: string;
    content?: any[];
    topic?: string;
    tags?: string[];
    featureImage?: string;
    author?: { name: string; photo: string; title: string };
    status?: "published" | "draft";
  }
) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const updateData: any = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update slug if title changed
    if (data.title) {
      updateData.slug = {
        current: data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      };
    }

    await adminDb.doc(`blogs/${blogId}`).update(updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Update blog error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBlog(blogId: string, userId: string) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Delete blog document
    await adminDb.doc(`blogs/${blogId}`).delete();

    // Delete Storage files (feature image)
    const bucket = adminStorage.bucket();
    const imagePrefix = `blog-images/${blogId}`;
    const [files] = await bucket.getFiles({ prefix: imagePrefix });
    await Promise.all(files.map((f) => f.delete()));

    return { success: true };
  } catch (error: any) {
    console.error("Delete blog error:", error);
    return { success: false, error: error.message };
  }
}

export async function batchDeleteBlogs(blogIds: string[], userId: string) {
  try {
    // Verify admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const bucket = adminStorage.bucket();

    for (const blogId of blogIds) {
      await adminDb.doc(`blogs/${blogId}`).delete();

      // Delete Storage files
      const imagePrefix = `blog-images/${blogId}`;
      const [files] = await bucket.getFiles({ prefix: imagePrefix });
      await Promise.all(files.map((f) => f.delete()));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Batch delete blogs error:", error);
    return { success: false, error: error.message };
  }
}

export async function uploadBlogImage(
  blogId: string,
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
    const fileName = `blog-images/${blogId}/${file.name}`;
    const fileUpload = bucket.file(fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fileUpload.save(buffer, {
      contentType: file.type,
    });

    // Generate signed URL
    const [signedUrl] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    // Update blog document
    await adminDb.doc(`blogs/${blogId}`).update({
      featureImage: signedUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { url: signedUrl } };
  } catch (error: any) {
    console.error("Upload blog image error:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllBlogTopics() {
  return [
    "LMS",
    "SCORM",
    "EdTech",
    "E-Learning",
    "Digital Learning",
    "Instructional Design",
    "Corporate Training",
    "Gamification",
    "AI in Education",
    "Assessment",
    "Learning Analytics",
    "Content Development",
  ];
}
