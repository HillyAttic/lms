import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage, FieldValue } from "@/lib/firebase-admin";
import JSZip from "jszip";

/**
 * Process an already-uploaded SCORM package from Firebase Storage.
 * The ZIP must already be at the `sourceZipPath` (uploaded directly by the client
 * via a signed URL from /api/repository/upload-url).
 *
 * POST /api/repository/upload
 * Content-Type: application/json
 *
 * Body:
 *   - itemId: Client-generated item ID
 *   - userId: The authenticated user's UID
 *   - name: Module name
 *   - description: Module description
 *   - features: Module features
 *   - interactivityLevel: Interactivity level (1, 2, 2.5, 3)
 *   - duration: Duration in minutes
 *   - sourceZipPath: Storage path where the ZIP was uploaded (e.g. "repository/repo_123/source.zip")
 */

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large extractions

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

export async function POST(request: NextRequest) {
  console.log("=== Process SCORM Upload ===");

  try {
    const body = await request.json();
    const {
      itemId,
      userId,
      name,
      description,
      features,
      interactivityLevel,
      duration,
      sourceZipPath,
    } = body;

    if (!name || !userId || !sourceZipPath) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, userId, and sourceZipPath are required" },
        { status: 400 }
      );
    }

    // Verify admin user
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const bucket = adminStorage.bucket();
    const resolvedItemId = itemId || `repo_${Date.now()}`;
    const extractedPath = `repository/${resolvedItemId}/extracted`;

    console.log("Processing SCORM:", {
      resolvedItemId,
      sourceZipPath,
      name,
      userId,
    });

    // Verify the source ZIP exists in Storage
    const [zipExists] = await bucket.file(sourceZipPath).exists();
    if (!zipExists) {
      return NextResponse.json(
        { success: false, error: "Source ZIP file not found in storage. Please re-upload." },
        { status: 400 }
      );
    }

    // Initialize progress tracking
    await updateUploadProgress(resolvedItemId, userId, {
      status: "preparing",
      phase: "Preparing extraction...",
      progress: 0,
    });

    // Download ZIP from Firebase Storage
    console.log("Downloading ZIP from storage...");
    await updateUploadProgress(resolvedItemId, userId, {
      status: "extracting",
      phase: "Downloading ZIP from storage...",
      progress: 5,
    });

    const [fileBuffer] = await bucket.file(sourceZipPath).download();
    console.log("ZIP downloaded, size:", fileBuffer.length);

    // Extract zip using JSZip
    console.log("Extracting ZIP contents...");
    await updateUploadProgress(resolvedItemId, userId, {
      status: "extracting",
      phase: "Extracting ZIP contents...",
      progress: 10,
    });

    const zip = new JSZip();
    const extractedZip = await zip.loadAsync(fileBuffer);
    console.log("ZIP loaded successfully");

    const files: Array<{ path: string; entry: JSZip.JSZipObject }> = [];

    extractedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        files.push({ path: relativePath, entry: zipEntry });
      }
    });

    console.log(`Found ${files.length} files in ZIP`);

    await updateUploadProgress(resolvedItemId, userId, {
      status: "extracting",
      phase: `Found ${files.length} files in ZIP`,
      progress: 15,
      totalFiles: files.length,
    });

    // Get manifest content
    let manifestContent: string | null = null;
    const manifestFile = files.find(
      (f) =>
        f.path.toLowerCase() === "imsmanifest.xml" ||
        f.path.toLowerCase().endsWith("/imsmanifest.xml")
    );

    if (manifestFile) {
      console.log("Found manifest file:", manifestFile.path);
      manifestContent = await manifestFile.entry.async("string");
    }

    // Upload files in batches
    console.log("Starting file uploads in batches...");
    const batchSize = 20;
    const totalBatches = Math.ceil(files.length / batchSize);

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;

      const progressBefore = 20 + Math.round((i / files.length) * 60);
      await updateUploadProgress(resolvedItemId, userId, {
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
        await bucket
          .file(`${extractedPath}/${path}`)
          .save(Buffer.from(content), {
            metadata: {
              cacheControl: "public, max-age=31536000",
            },
          });
      });
      await Promise.all(uploadPromises);

      const uploadedAfter = Math.min(i + batchSize, files.length);
      const progressAfter = 20 + Math.round((uploadedAfter / files.length) * 60);
      await updateUploadProgress(resolvedItemId, userId, {
        uploadedFiles: uploadedAfter,
        progress: progressAfter,
      });
    }

    console.log("All files uploaded successfully");

    await updateUploadProgress(resolvedItemId, userId, {
      status: "processing",
      phase: "Processing manifest and creating record...",
      progress: 85,
      uploadedFiles: files.length,
    });

    // Parse manifest
    let scormVersion = "1.2";
    let entryPoint = "story.html";

    if (manifestContent) {
      const schemaMatch = manifestContent.match(
        /<schemaversion>(.*?)<\/schemaversion>/i
      );
      if (schemaMatch) {
        const schemaVersion = schemaMatch[1];
        if (
          schemaVersion.includes("2004") ||
          schemaVersion.includes("CAM")
        ) {
          scormVersion = "2004";
        }
      }
    }

    // Get next serial number
    const countSnapshot = await adminDb.collection("repository").count().get();
    const nextSerialNumber = countSnapshot.data().count + 1;

    // Create Firestore document
    await adminDb.collection("repository").doc(resolvedItemId).set({
      serialNumber: nextSerialNumber,
      name,
      description,
      features,
      interactivityLevel: parseFloat(interactivityLevel),
      duration: parseInt(duration),
      scormVersion,
      entryPoint,
      storagePath: extractedPath,
      sourceZipPath,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: userId,
    });

    console.log("Firestore document created");

    await updateUploadProgress(resolvedItemId, userId, {
      status: "complete",
      phase: "Upload complete!",
      progress: 100,
    });

    console.log("=== Process SCORM Upload Complete ===");

    return NextResponse.json({ success: true, itemId: resolvedItemId });
  } catch (error: any) {
    console.error("=== Process SCORM Upload Error ===");
    console.error("Error details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload processing failed" },
      { status: 500 }
    );
  }
}
