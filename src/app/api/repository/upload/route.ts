import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage, FieldValue } from "@/lib/firebase-admin";
import JSZip from "jszip";

/**
 * Direct upload API route for SCORM packages.
 * Bypasses Server Action body size limits by streaming directly to Firebase Storage.
 *
 * POST /api/repository/upload
 * Content-Type: multipart/form-data
 *
 * Fields:
 *   - file: The SCORM ZIP file
 *   - userId: The authenticated user's UID
 *   - itemId: Client-generated item ID
 *   - name: Module name
 *   - description: Module description
 *   - features: Module features
 *   - interactivityLevel: Interactivity level (1, 2, 2.5, 3)
 *   - duration: Duration in minutes
 */

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large uploads

// Increase the body size limit for this route (500MB)
export const config = {
  api: {
    bodyParser: false,
  },
};

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
  console.log("=== Direct Upload API Called ===");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const clientItemId = formData.get("itemId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const features = formData.get("features") as string;
    const interactivityLevel = parseFloat(formData.get("interactivityLevel") as string);
    const duration = parseInt(formData.get("duration") as string);

    if (!file || !name || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: file, name, and userId are required" },
        { status: 400 }
      );
    }

    console.log("Upload details:", {
      fileName: file.name,
      fileSize: file.size,
      name,
      userId,
    });

    // Verify admin user
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || userDoc.data()?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const itemId = clientItemId || `repo_${Date.now()}`;
    const storageBase = `repository/${itemId}`;
    const sourceZipPath = `${storageBase}/source.zip`;
    const extractedPath = `${storageBase}/extracted`;

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

    const bucket = adminStorage.bucket();

    // Upload source zip to Firebase Storage
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

    const files: Array<{ path: string; entry: JSZip.JSZipObject }> = [];

    extractedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        files.push({ path: relativePath, entry: zipEntry });
      }
    });

    console.log(`Found ${files.length} files in ZIP`);

    await updateUploadProgress(itemId, userId, {
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
      status: "complete",
      phase: "Upload complete!",
      progress: 100,
    });

    console.log("=== Direct Upload Complete ===");

    return NextResponse.json({ success: true, itemId });
  } catch (error: any) {
    console.error("=== Direct Upload Error ===");
    console.error("Error details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
