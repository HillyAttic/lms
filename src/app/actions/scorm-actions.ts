"use server";

import { adminDb, adminStorage, FieldValue } from "@/lib/firebase-admin";
import { canAccessAdminPanel } from "@/lib/roles";
import JSZip from "jszip";
import { revalidatePath } from "next/cache";

// Note: DOMParser is not available in Node.js server actions
// We'll use a simple regex-based XML parser for imsmanifest.xml

/**
 * Process SCORM package from Firebase Storage
 * File must already be uploaded directly to storage via signed URL
 */
export async function processScormPackage(
  userId: string,
  sourceZipPath: string,
  title: string,
  description: string,
  features: string,
  interactivityLevel: number,
  duration: number,
  thumbnailUrl?: string | null
) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user is admin
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
      return { success: false, error: "Admin access required" };
    }

    if (!sourceZipPath || !title) {
      return { success: false, error: "Source ZIP path and title are required" };
    }

    // Generate course ID. Extracted files land under the same prefix the
    // launch proxy serves (`/api/repository/launch/:id/...`).
    const courseId = `course_${Date.now()}`;
    const extractedPath = `repository/${courseId}/extracted`;

    const bucket = adminStorage.bucket();

    // Download ZIP from Firebase Storage
    const [fileBuffer] = await bucket.file(sourceZipPath).download();

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
            return bucket
              .file(`${extractedPath}/${relativePath}`)
              .save(Buffer.from(content))
              .then(() => {});
          })
        );
      }
    });

    await Promise.all(uploadPromises);

    // Get manifest content
    const manifestResults = await Promise.all(manifestPromises);
    const imsManifestContent = manifestResults.find((c) => c !== null) || null;

    // Parse imsmanifest.xml using regex (DOMParser not available in Node.js)
    let scormVersion = "1.2";
    let entryPoint = "index.html";

    if (imsManifestContent) {
      // Detect SCORM version
      const schemaMatch = imsManifestContent.match(
        /<schemaversion>(.*?)<\/schemaversion>/i
      );
      if (schemaMatch) {
        const schemaVersion = schemaMatch[1];
        if (schemaVersion.includes("2004") || schemaVersion.includes("CAM")) {
          scormVersion = "2004";
        } else if (schemaVersion.includes("1.2")) {
          scormVersion = "1.2";
        }
      }

      /* Storyline publishes `index_lms.html` (the SCORM driver) next to the
         web-only `story.html`; launching the latter means no score is ever
         reported. Attribute order varies by exporter, so map resources by
         identifier and resolve the first item's identifierref — don't assume
         an order inside the tag. */
      const resources = new Map<string, string>();
      for (const [tag] of imsManifestContent.matchAll(/<resource\b[^>]*>/gi)) {
        const identifier = tag.match(/\bidentifier="([^"]+)"/i)?.[1];
        const href = tag.match(/\bhref="([^"]+)"/i)?.[1];
        if (identifier && href) resources.set(identifier, href);
      }

      const itemRef = imsManifestContent.match(
        /<item\b[^>]*\bidentifierref="([^"]+)"/i
      )?.[1];
      entryPoint =
        (itemRef && resources.get(itemRef)) ||
        resources.values().next().value ||
        entryPoint;
    }

    // Write to `repository` — the one collection the storefront reads. Admin
    // rows map this shape back to the title/status fields they display.
    const repository = adminDb.collection("repository");
    const serialNumber = (await repository.count().get()).data().count + 1;
    await repository.doc(courseId).set({
      serialNumber,
      name: title,
      description,
      features,
      interactivityLevel,
      duration,
      status: "active",
      scormVersion,
      entryPoint,
      storagePath: extractedPath,
      sourceZipPath,
      thumbnailUrl: thumbnailUrl || null,
      categories: [],
      tags: [],
      objectives: "",
      prerequisites: "",
      targetAudience: "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: userId,
    });

    revalidatePath("/courses");
    revalidatePath("/repository");
    revalidatePath("/admin/repository");
    revalidatePath("/admin/courses");
    revalidatePath("/admin");

    return { success: true, courseId };
  } catch (error: any) {
    console.error("Process SCORM error:", error);
    return { success: false, error: error.message || "Processing failed" };
  }
}

export async function updateCourse(
  courseId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    features?: string;
    interactivityLevel?: number;
    duration?: number;
    status?: "active" | "draft";
    categories?: string[];
    tags?: string[];
    objectives?: string;
    prerequisites?: string;
    targetAudience?: string;
  }
) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
      return { success: false, error: "Admin access required" };
    }

    const { title: newTitle, ...fields } = data;
    await adminDb.doc(`repository/${courseId}`).update({
      ...fields,
      ...(newTitle !== undefined ? { name: newTitle } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/courses");
    revalidatePath("/repository");
    revalidatePath("/admin/courses");
    revalidatePath("/admin/repository");

    return { success: true };
  } catch (error: any) {
    console.error("Update error:", error);
    return { success: false, error: error.message || "Update failed" };
  }
}

export async function deleteCourse(courseId: string, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
      return { success: false, error: "Admin access required" };
    }

    // Delete course document
    await adminDb.doc(`repository/${courseId}`).delete();

    // Delete Storage files using Admin SDK
    const bucket = adminStorage.bucket();
    const scormPrefix = `repository/${courseId}`;
    const [scormFiles] = await bucket.getFiles({ prefix: scormPrefix });
    const deleteScormPromises = scormFiles.map((file) => file.delete());

    // Delete thumbnail files
    const thumbPrefix = `thumbnails/${courseId}`;
    const [thumbFiles] = await bucket.getFiles({ prefix: thumbPrefix });
    const deleteThumbPromises = thumbFiles.map((file) => file.delete());

    await Promise.all([...deleteScormPromises, ...deleteThumbPromises]);

    revalidatePath("/courses");
    revalidatePath("/repository");
    revalidatePath("/admin/courses");
    revalidatePath("/admin/repository");

    return { success: true };
  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message || "Delete failed" };
  }
}

export async function uploadThumbnail(courseId: string, file: File, userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists || !canAccessAdminPanel(userDoc.data()?.role)) {
      return { success: false, error: "Admin access required" };
    }

    const bucket = adminStorage.bucket();

    // Delete old thumbnail if exists
    const oldThumbPrefix = `thumbnails/${courseId}`;
    const [oldFiles] = await bucket.getFiles({ prefix: oldThumbPrefix });
    await Promise.all(oldFiles.map((f) => f.delete()));

    // Upload new thumbnail
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const thumbPath = `thumbnails/${courseId}/thumbnail.${ext}`;
    await bucket.file(thumbPath).save(fileBuffer, {
      contentType: file.type,
    });

    const [url] = await bucket.file(thumbPath).getSignedUrl({
      action: "read",
      expires: "2037-12-31",
    });

    // Update course document
    await adminDb.doc(`repository/${courseId}`).update({
      thumbnailUrl: url,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/courses");
    revalidatePath("/repository");
    revalidatePath("/admin/courses");
    revalidatePath("/admin/repository");

    return { success: true, thumbnailUrl: url };
  } catch (error: any) {
    console.error("Thumbnail upload error:", error);
    return { success: false, error: error.message || "Thumbnail upload failed" };
  }
}
