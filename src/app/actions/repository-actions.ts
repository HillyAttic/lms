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

// Upload SCORM package to repository
export async function uploadRepositoryScorm(formData: FormData) {
  console.log("=== Starting SCORM Upload ===");

  let itemId = "";
  let userId = "";

  try {
    userId = formData.get("userId") as string;
    const clientItemId = formData.get("itemId") as string;

    if (!userId) {
      console.error("No userId provided");
      return { success: false, error: "User not authenticated" };
    }

    console.log("User ID:", userId);

    // Check if user is admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      console.error("User is not admin or doesn't exist");
      return { success: false, error: "Admin access required" };
    }

    console.log("User verified as admin");

    // Get form data
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const features = formData.get("features") as string;
    const interactivityLevel = parseFloat(formData.get("interactivityLevel") as string);
    const duration = parseInt(formData.get("duration") as string);

    console.log("Form data:", { name, fileSize: file?.size, fileName: file?.name });

    if (!file || !name) {
      console.error("Missing file or name");
      return { success: false, error: "File and name are required" };
    }

    // Check file size (200MB limit)
    if (file.size > 200 * 1024 * 1024) {
      console.error("File too large:", file.size);
      return { success: false, error: "File size exceeds 200MB limit" };
    }

    // Generate item ID (use client-provided ID if available)
    const itemId = clientItemId || `repo_${Date.now()}`;
    const storageBase = `repository/${itemId}`;
    const sourceZipPath = `${storageBase}/source.zip`;
    const extractedPath = `${storageBase}/extracted`;

    console.log("Generated item ID:", itemId);

    // Initialize progress tracking
    await updateUploadProgress(itemId, userId, {
      status: "preparing",
      phase: "Preparing upload...",
      progress: 0,
      fileName: file.name,
      fileSize: file.size,
      startedAt: FieldValue.serverTimestamp(),
    });

    // Convert file to buffer
    console.log("Converting file to buffer...");
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log("Buffer created, size:", fileBuffer.length);

    // Upload source zip to Firebase Storage using Admin SDK
    console.log("Getting Firebase Storage bucket...");
    const bucket = adminStorage.bucket();
    console.log("Bucket name:", bucket.name);

    console.log("Uploading source ZIP...");
    await updateUploadProgress(itemId, userId, {
      status: "uploading_zip",
      phase: "Uploading ZIP to storage...",
      progress: 5,
    });

    await bucket.file(sourceZipPath).save(fileBuffer, {
      contentType: "application/zip",
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });
    console.log("Source ZIP uploaded successfully");

    // Extract zip using JSZip
    console.log("Extracting ZIP contents...");
    await updateUploadProgress(itemId, userId, {
      status: "extracting",
      phase: "Extracting ZIP contents...",
      progress: 10,
    });

    const zip = new JSZip();
    const extractedZip = await zip.loadAsync(fileBuffer);
    console.log("ZIP loaded successfully");

    // Process files in smaller batches to avoid memory issues
    const files: Array<{ path: string; entry: JSZip.JSZipObject }> = [];
    let manifestContent: string | null = null;

    extractedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        files.push({ path: relativePath, entry: zipEntry });
      }
    });

    console.log(`Found ${files.length} files in ZIP`);

    // Update progress with file count
    await updateUploadProgress(itemId, userId, {
      status: "extracting",
      phase: `Found ${files.length} files in ZIP`,
      progress: 15,
      totalFiles: files.length,
    });

    // Get manifest content first
    const manifestFile = files.find(f =>
      f.path.toLowerCase() === "imsmanifest.xml" ||
      f.path.toLowerCase().endsWith("/imsmanifest.xml")
    );

    if (manifestFile) {
      console.log("Found manifest file:", manifestFile.path);
      manifestContent = await manifestFile.entry.async("string");
    } else {
      console.warn("No manifest file found");
    }

    // Upload files in batches of 20 to avoid memory issues
    console.log("Starting file uploads in batches...");
    const batchSize = 20;
    const totalBatches = Math.ceil(files.length / batchSize);

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      console.log(`Uploading batch ${currentBatch}/${totalBatches}`);

      // Update progress before this batch
      const progressBefore = 20 + Math.round((i / files.length) * 60);
      await updateUploadProgress(itemId, userId, {
        status: "uploading_files",
        phase: `Uploading batch ${currentBatch}/${totalBatches}...`,
        progress: progressBefore,
        uploadedFiles: i,
        totalFiles: files.length,
        currentBatch,
        totalBatches,
      });

      const uploadPromises = batch.map(async ({ path, entry }) => {
        const content = await entry.async("uint8array");
        await bucket.file(`${extractedPath}/${path}`).save(Buffer.from(content), {
          metadata: {
            cacheControl: "public, max-age=31536000",
          },
        });
      });
      await Promise.all(uploadPromises);

      // Update progress after this batch
      const uploadedAfter = Math.min(i + batchSize, files.length);
      const progressAfter = 20 + Math.round((uploadedAfter / files.length) * 60);
      await updateUploadProgress(itemId, userId, {
        uploadedFiles: uploadedAfter,
        progress: progressAfter,
      });
    }
    console.log("All files uploaded successfully");

    await updateUploadProgress(itemId, userId, {
      status: "processing",
      phase: "Processing manifest and creating record...",
      progress: 85,
      uploadedFiles: files.length,
    });

    // Parse imsmanifest.xml using regex
    let scormVersion = "1.2";
    // Always use story.html as the entry point
    let entryPoint = "story.html";

    if (manifestContent) {
      console.log("Parsing manifest...");

      // Detect SCORM version
      const schemaMatch = manifestContent.match(/<schemaversion>(.*?)<\/schemaversion>/i);
      if (schemaMatch) {
        const schemaVersion = schemaMatch[1];
        if (schemaVersion.includes("2004") || schemaVersion.includes("CAM")) {
          scormVersion = "2004";
        } else if (schemaVersion.includes("1.2")) {
          scormVersion = "1.2";
        }
      }

      console.log("Parsed manifest:", { scormVersion, entryPoint });
    }

    // Get next serial number
    console.log("Getting next serial number...");
    const countSnapshot = await adminDb.collection("repository").count().get();
    const nextSerialNumber = countSnapshot.data().count + 1;
    console.log("Next serial number:", nextSerialNumber);

    // Create Firestore document using Admin SDK
    console.log("Creating Firestore document...");
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
    console.log("Firestore document created");

    await updateUploadProgress(itemId, userId, {
      status: "processing",
      phase: "Finalizing upload...",
      progress: 95,
    });

    console.log("Revalidating paths...");
    revalidatePath("/repository");
    revalidatePath("/admin/repository");

    await updateUploadProgress(itemId, userId, {
      status: "complete",
      phase: "Upload complete!",
      progress: 100,
    });

    console.log("=== Upload Complete ===");
    // Return minimal response to avoid body size issues
    return { success: true, itemId };
  } catch (error: any) {
    console.error("=== Upload Error ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    // Try to update progress with error status (if we had an itemId)
    try {
      if (itemId) {
        await updateUploadProgress(itemId, userId || "", {
          status: "error",
          phase: error.message || "Upload failed",
          progress: 0,
        });
      }
    } catch {}
    return { success: false, error: error.message || "Upload failed" };
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
      fileSize: parseInt(metadata.size || "0", 10),
      contentType: metadata.contentType,
      updated: metadata.updated,
    };
  } catch (error: any) {
    console.error("Get zip file metadata error:", error);
    return { success: false, error: error.message || "Failed to get zip metadata" };
  }
}
