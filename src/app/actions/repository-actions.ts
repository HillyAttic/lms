"use server";

import { adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";
import JSZip from "jszip";
import { revalidatePath } from "next/cache";

interface RepositoryItem {
  id: string;
  serialNumber: number;
  name: string;
  interactivityLevel: number;
  features: string;
  description: string;
  duration: number;
  scormVersion: string;
  entryPoint: string;
  storagePath: string;
  sourceZipPath: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

// Get all repository items
export async function getRepositoryItems() {
  try {
    const snapshot = await adminDb
      .collection("repository")
      .orderBy("serialNumber", "asc")
      .get();

    const items = snapshot.docs.map((doc, index) => ({
      id: doc.id,
      serialNumber: index + 1,
      ...doc.data(),
    }));

    return { success: true, data: serializeTimestamps(items) };
  } catch (error: any) {
    console.error("Get repository items error:", error);
    return { success: false, error: error.message };
  }
}

// Get repository items with pagination
export async function getRepositoryItemsPaginated(
  page: number = 1,
  limit: number = 10,
  search?: string,
  interactivityLevel?: number
) {
  try {
    const snapshot = await adminDb
      .collection("repository")
      .orderBy("serialNumber", "asc")
      .get();

    let items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.features?.toLowerCase().includes(searchLower)
      );
    }

    // Apply interactivity level filter
    if (interactivityLevel !== undefined && interactivityLevel !== null) {
      items = items.filter(
        (item: any) => item.interactivityLevel === interactivityLevel
      );
    }

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = items.slice(offset, offset + limit);

    return {
      success: true,
      data: serializeTimestamps(data),
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error("Get repository items paginated error:", error);
    return { success: false, error: error.message };
  }
}

// Get single repository item by ID
export async function getRepositoryItemById(itemId: string) {
  try {
    const doc = await adminDb.doc(`repository/${itemId}`).get();
    if (!doc.exists) {
      return { success: false, error: "Repository item not found" };
    }
    return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
  } catch (error: any) {
    console.error("Get repository item error:", error);
    return { success: false, error: error.message };
  }
}

// Upload SCORM package to repository
export async function uploadRepositoryScorm(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user is admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Get form data
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const features = formData.get("features") as string;
    const interactivityLevel = parseFloat(formData.get("interactivityLevel") as string);
    const duration = parseInt(formData.get("duration") as string);

    if (!file || !name) {
      return { success: false, error: "File and name are required" };
    }

    // Generate item ID
    const itemId = `repo_${Date.now()}`;
    const storageBase = `repository/${itemId}`;
    const sourceZipPath = `${storageBase}/source.zip`;
    const extractedPath = `${storageBase}/extracted`;

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload source zip to Firebase Storage using Admin SDK
    const bucket = adminStorage.bucket();
    await bucket.file(sourceZipPath).save(fileBuffer, {
      contentType: "application/zip",
    });

    // Extract zip using JSZip
    const zip = new JSZip();
    const extractedZip = await zip.loadAsync(fileBuffer);

    // Upload extracted files to Firebase Storage
    const uploadPromises: Promise<void>[] = [];
    const manifestPromises: Promise<string | null>[] = [];

    extractedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        // Check if this is the imsmanifest.xml file
        const isManifest =
          relativePath.toLowerCase() === "imsmanifest.xml" ||
          relativePath.toLowerCase().endsWith("/imsmanifest.xml");

        if (isManifest) {
          manifestPromises.push(
            zipEntry.async("string").then((content) => content)
          );
        }

        uploadPromises.push(
          zipEntry.async("uint8array").then((content) => {
            return bucket.file(`${extractedPath}/${relativePath}`).save(Buffer.from(content)).then(() => {});
          })
        );
      }
    });

    await Promise.all(uploadPromises);

    // Get manifest content
    const manifestResults = await Promise.all(manifestPromises);
    const imsManifestContent = manifestResults.find((c) => c !== null) || null;

    // Parse imsmanifest.xml using regex
    let scormVersion = "1.2";
    let entryPoint = "story.html";

    if (imsManifestContent) {
      // Detect SCORM version
      const schemaMatch = imsManifestContent.match(/<schemaversion>(.*?)<\/schemaversion>/i);
      if (schemaMatch) {
        const schemaVersion = schemaMatch[1];
        if (schemaVersion.includes("2004") || schemaVersion.includes("CAM")) {
          scormVersion = "2004";
        } else if (schemaVersion.includes("1.2")) {
          scormVersion = "1.2";
        }
      }

      // Parse resources to find entry point
      const resourceRegex = /<resource[^>]*identifier="([^"]*)"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/resource>/gi;
      let resourceMatch;

      while ((resourceMatch = resourceRegex.exec(imsManifestContent)) !== null) {
        const href = resourceMatch[2];
        if (href && href.toLowerCase().includes("story.html")) {
          entryPoint = href;
          break;
        }
      }
    }

    // Get next serial number
    const countSnapshot = await adminDb.collection("repository").count().get();
    const nextSerialNumber = countSnapshot.data().count + 1;

    // Create Firestore document using Admin SDK
    await adminDb.collection("repository").doc(itemId).set({
      serialNumber: nextSerialNumber,
      name,
      description,
      features,
      interactivityLevel,
      duration,
      scormVersion,
      entryPoint,
      storagePath: extractedPath,
      sourceZipPath,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: userId,
    });

    revalidatePath("/repository");
    revalidatePath("/admin/repository");

    return { success: true, itemId };
  } catch (error: any) {
    console.error("Upload repository SCORM error:", error);
    return { success: false, error: error.message || "Upload failed" };
  }
}

// Update repository item
export async function updateRepositoryItem(
  itemId: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    features?: string;
    interactivityLevel?: number;
    duration?: number;
  }
) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    await adminDb.doc(`repository/${itemId}`).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/repository");
    revalidatePath("/admin/repository");

    return { success: true };
  } catch (error: any) {
    console.error("Update repository item error:", error);
    return { success: false, error: error.message || "Update failed" };
  }
}

// Delete repository item
export async function deleteRepositoryItem(itemId: string, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Delete repository document
    await adminDb.doc(`repository/${itemId}`).delete();

    // Delete Storage files using Admin SDK
    const bucket = adminStorage.bucket();
    const repoPrefix = `repository/${itemId}`;
    const [repoFiles] = await bucket.getFiles({ prefix: repoPrefix });
    const deletePromises = repoFiles.map((file) => file.delete().then(() => {}));

    await Promise.all(deletePromises);

    revalidatePath("/repository");
    revalidatePath("/admin/repository");

    return { success: true };
  } catch (error: any) {
    console.error("Delete repository item error:", error);
    return { success: false, error: error.message || "Delete failed" };
  }
}

// Batch delete repository items
export async function batchDeleteRepositoryItems(itemIds: string[], userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const bucket = adminStorage.bucket();
    const deleteFilePromises: Promise<void>[] = [];

    for (const itemId of itemIds) {
      // Delete document
      await adminDb.doc(`repository/${itemId}`).delete();

      // Delete storage files
      const repoPrefix = `repository/${itemId}`;
      const [repoFiles] = await bucket.getFiles({ prefix: repoPrefix });
      deleteFilePromises.push(...repoFiles.map((file) => file.delete().then(() => {})));
    }

    await Promise.all(deleteFilePromises);

    revalidatePath("/repository");
    revalidatePath("/admin/repository");

    return { success: true };
  } catch (error: any) {
    console.error("Batch delete repository items error:", error);
    return { success: false, error: error.message || "Batch delete failed" };
  }
}

// Get SCORM launch URL (for opening in new tab)
export async function getScormLaunchUrl(itemId: string) {
  try {
    const doc = await adminDb.doc(`repository/${itemId}`).get();
    if (!doc.exists) {
      return { success: false, error: "Repository item not found" };
    }

    const data = doc.data()!;
    const entryPoint = data.entryPoint || "story.html";
    const storagePath = data.storagePath;

    // Get signed URL for the entry point file
    const bucket = adminStorage.bucket();
    const filePath = `${storagePath}/${entryPoint}`;
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    return { success: true, url };
  } catch (error: any) {
    console.error("Get SCORM launch URL error:", error);
    return { success: false, error: error.message || "Failed to get launch URL" };
  }
}
