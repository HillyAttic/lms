"use server";

import { adminDb, adminStorage, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";
import JSZip from "jszip";
import { revalidatePath } from "next/cache";

// Upload progress tracking helper
async function updateUploadProgress(
  itemId: string,
  userId: string,
  updates: Record<string, any>
) {
  await adminDb.doc(`upload_progress/${itemId}_upload`).set(
    {
      itemId,
      userId,
      updatedAt: FieldValue.serverTimestamp(),
      ...updates,
    },
    { merge: true }
  );
}

// Get upload progress for a given item
export async function getUploadProgress(itemId: string) {
  try {
    const doc = await adminDb.doc(`upload_progress/${itemId}_upload`).get();
    if (!doc.exists) return { success: false, error: "Not found" };
    return { success: true, data: serializeTimestamps(doc.data()) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Clean up upload progress document after completion
export async function cleanupUploadProgress(itemId: string) {
  try {
    await adminDb.doc(`upload_progress/${itemId}_upload`).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
    // Start with a query
    let query = adminDb.collection("repository").orderBy("serialNumber", "asc");

    // Get all items for counting (but only IDs and filter fields)
    const countSnapshot = await adminDb
      .collection("repository")
      .select("serialNumber", "name", "description", "features", "interactivityLevel")
      .get();

    let allItems = countSnapshot.docs.map((doc) => ({
      id: doc.id,
      serialNumber: doc.data().serialNumber,
      name: doc.data().name,
      description: doc.data().description,
      features: doc.data().features,
      interactivityLevel: doc.data().interactivityLevel,
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allItems = allItems.filter(
        (item: any) =>
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.features?.toLowerCase().includes(searchLower)
      );
    }

    // Apply interactivity level filter
    if (interactivityLevel !== undefined && interactivityLevel !== null) {
      allItems = allItems.filter(
        (item: any) => item.interactivityLevel === interactivityLevel
      );
    }

    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    // Get only the IDs we need for this page
    const pageItemIds = allItems.slice(offset, offset + limit).map(item => item.id);

    // Fetch only the full data for items on this page
    const pageItemsPromises = pageItemIds.map(id => 
      adminDb.doc(`repository/${id}`).get()
    );
    const pageItemsDocs = await Promise.all(pageItemsPromises);

    const data = pageItemsDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

// Update repository item
/**
 * Get list of extracted files from a SCORM package
 */
export async function getExtractedFiles(itemId: string) {
  try {
    const doc = await adminDb.collection("repository").doc(itemId).get();
    
    if (!doc.exists) {
      return { success: false, error: "Repository item not found" };
    }

    const data = doc.data()!;
    const storagePath = data.storagePath;
    const bucket = adminStorage.bucket();

    console.log("Listing files in:", storagePath);

    // List all files in the extracted folder
    const [files] = await bucket.getFiles({ prefix: storagePath + "/" });
    
    const fileList = files
      .filter(file => !file.name.endsWith("/")) // Filter out directory markers
      .map(file => {
        const relativePath = file.name.replace(storagePath + "/", "");
        return {
          name: relativePath,
          fullPath: file.name,
          isHtml: relativePath.toLowerCase().endsWith(".html"),
        };
      })
      .sort((a, b) => {
        // Sort HTML files first
        if (a.isHtml && !b.isHtml) return -1;
        if (!a.isHtml && b.isHtml) return 1;
        return a.name.localeCompare(b.name);
      });

    return { 
      success: true, 
      files: fileList,
      currentEntryPoint: data.entryPoint,
    };
  } catch (error: any) {
    console.error("Get extracted files error:", error);
    return { success: false, error: error.message || "Failed to get files" };
  }
}

/**
 * Update entry point for a SCORM package
 */
export async function updateEntryPoint(itemId: string, userId: string, entryPoint: string) {
  try {
    const doc = await adminDb.collection("repository").doc(itemId).get();
    
    if (!doc.exists) {
      return { success: false, error: "Repository item not found" };
    }

    const data = doc.data()!;
    const storagePath = data.storagePath;
    const bucket = adminStorage.bucket();

    // Verify the entry point file exists
    const filePath = `${storagePath}/${entryPoint}`;
    const [exists] = await bucket.file(filePath).exists();

    if (!exists) {
      return { success: false, error: "Entry point file does not exist in storage" };
    }

    // Update the entry point
    await adminDb.collection("repository").doc(itemId).update({
      entryPoint,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update entry point error:", error);
    return { success: false, error: error.message || "Failed to update entry point" };
  }
}

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
    console.log("=== Starting Delete ===");
    console.log("Item ID:", itemId);
    console.log("User ID:", userId);

    if (!userId) {
      console.error("No userId provided");
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      console.error("User is not admin or doesn't exist:", userDoc.exists ? "exists but wrong role" : "not found");
      return { success: false, error: "Admin access required" };
    }

    // Verify document exists
    const repoDoc = await adminDb.doc(`repository/${itemId}`).get();
    if (!repoDoc.exists) {
      console.error("Repository document not found:", itemId);
      return { success: false, error: "Repository item not found" };
    }
    console.log("Repository document found, proceeding with deletion");

    // Delete repository document
    await adminDb.doc(`repository/${itemId}`).delete();
    console.log("Firestore document deleted");

    // Delete Storage files using Admin SDK
    const bucket = adminStorage.bucket();
    const repoPrefix = `repository/${itemId}`;
    console.log("Finding storage files with prefix:", repoPrefix);
    const [repoFiles] = await bucket.getFiles({ prefix: repoPrefix });
    console.log(`Found ${repoFiles.length} files to delete`);

    if (repoFiles.length > 0) {
      const deletePromises = repoFiles.map((file) => file.delete().then(() => {}));
      await Promise.all(deletePromises);
      console.log("Storage files deleted");
    }

    revalidatePath("/repository");
    revalidatePath("/admin/repository");

    console.log("=== Delete Complete ===");
    return { success: true };
  } catch (error: any) {
    console.error("=== Delete Error ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
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
    // Always use story.html as the entry point for launching
    const entryPoint = "story.html";
    const storagePath = data.storagePath;
    const bucket = adminStorage.bucket();

    console.log("Getting launch URL for:", {
      itemId,
      entryPoint,
      storagePath,
    });

    // Use the stored entry point directly - admin has full control
    const filePath = `${storagePath}/${entryPoint}`;

    // Verify the file exists
    const [fileExists] = await bucket.file(filePath).exists();

    if (!fileExists) {
      console.error("Entry point file not found:", filePath);
      return {
        success: false,
        error: `Entry point file "${entryPoint}" not found. Please update the entry point in admin panel.`
      };
    }

    console.log("Generating signed URL for:", filePath);

    // Get signed URL for the entry point file
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    console.log("Generated URL:", url);

    return { success: true, url };
  } catch (error: any) {
    console.error("Get SCORM launch URL error:", error);
    return { success: false, error: error.message || "Failed to get launch URL" };
  }
}

/**
 * Get zip file metadata (size) from Firebase Storage
 */
export async function getZipFileMetadata(itemId: string) {
  try {
    const doc = await adminDb.collection("repository").doc(itemId).get();

    if (!doc.exists) {
      return { success: false, error: "Repository item not found" };
    }

    const data = doc.data()!;
    const sourceZipPath = data.sourceZipPath;

    if (!sourceZipPath) {
      return { success: false, error: "No source zip path found" };
    }

    const bucket = adminStorage.bucket();
    const [fileExists] = await bucket.file(sourceZipPath).exists();

    if (!fileExists) {
      return { success: false, error: "Source zip file not found in storage" };
    }

    const [metadata] = await bucket.file(sourceZipPath).getMetadata();

    return {
      success: true,
      fileSize: parseInt(String(metadata.size || "0"), 10),
      contentType: metadata.contentType,
      updated: metadata.updated,
    };
  } catch (error: any) {
    console.error("Get zip file metadata error:", error);
    return { success: false, error: error.message || "Failed to get zip metadata" };
  }
}
