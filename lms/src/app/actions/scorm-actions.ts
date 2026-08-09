"use server";

import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, deleteObject, listAll } from "firebase/storage";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import JSZip from "jszip";
import { revalidatePath } from "next/cache";

// Note: DOMParser is not available in Node.js server actions
// We'll use a simple regex-based XML parser for imsmanifest.xml

interface ScormStructure {
  entryPoint: string;
  scos: Array<{
    identifier: string;
    title: string;
    href: string;
    resources: string[];
  }>;
  storagePath: string;
  sourceZipPath: string;
}

export async function uploadScormPackage(formData: FormData) {
  try {
    // Note: Server actions don't have direct access to auth.currentUser
    // We'll get the user ID from the form data (passed from client after auth check)
    const userId = formData.get("userId") as string;

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Check if user is admin
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Get form data
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const features = formData.get("features") as string;
    const interactivityLevel = parseFloat(formData.get("interactivityLevel") as string);
    const duration = parseInt(formData.get("duration") as string);

    if (!file || !title) {
      return { success: false, error: "File and title are required" };
    }

    // Generate course ID
    const courseId = `course_${Date.now()}`;
    const storagePath = `scorm/${courseId}`;
    const sourceZipPath = `${storagePath}/source.zip`;
    const extractedPath = `${storagePath}/extracted`;

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload source zip to Firebase Storage
    const zipRef = ref(storage, sourceZipPath);
    await uploadBytes(zipRef, fileBuffer);

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
            const fileRef = ref(storage, `${extractedPath}/${relativePath}`);
            return uploadBytes(fileRef, content).then(() => {});
          })
        );
      }
    });

    await Promise.all(uploadPromises);

    // Get manifest content
    const manifestResults = await Promise.all(manifestPromises);
    const imsManifestContent = manifestResults.find((c) => c !== null) || null;

    // Parse imsmanifest.xml using regex (DOMParser not available in Node.js)
    let scormStructure: ScormStructure;
    let scormVersion = "1.2";
    let entryPoint = "index.html";

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

      // Parse resources
      const resources: Map<string, { href: string; files: string[] }> = new Map();
      const resourceRegex = /<resource[^>]*identifier="([^"]*)"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/resource>/gi;
      let resourceMatch;

      while ((resourceMatch = resourceRegex.exec(imsManifestContent)) !== null) {
        const identifier = resourceMatch[1];
        const href = resourceMatch[2];
        const files: string[] = [];

        const fileRegex = /<file[^>]*href="([^"]*)"[^>]*\/?>/gi;
        let fileMatch;
        while ((fileMatch = fileRegex.exec(resourceMatch[3])) !== null) {
          files.push(fileMatch[1]);
        }

        resources.set(identifier, { href, files });
      }

      // Parse items (SCOs)
      const scos: Array<{ identifier: string; title: string; href: string; resources: string[] }> = [];
      const itemRegex = /<item[^>]*identifier="([^"]*)"[^>]*title="([^"]*)"[^>]*identifierref="([^"]*)"[^>]*\/?>/gi;
      let itemMatch;

      while ((itemMatch = itemRegex.exec(imsManifestContent)) !== null) {
        const identifier = itemMatch[1];
        const title = itemMatch[2];
        const identifierref = itemMatch[3];
        const resource = resources.get(identifierref);
        const href = resource?.href || "";

        if (identifier && title) {
          scos.push({
            identifier,
            title,
            href,
            resources: resource?.files || [],
          });

          // Set entry point to first SCO
          if (scos.length === 1 && href) {
            entryPoint = href;
          }
        }
      }

      scormStructure = {
        entryPoint,
        scos,
        storagePath: extractedPath,
        sourceZipPath,
      };
    } else {
      // Fallback if no manifest found
      scormStructure = {
        entryPoint: "index.html",
        scos: [
          {
            identifier: "SCO_1",
            title: title,
            href: "index.html",
            resources: [],
          },
        ],
        storagePath: extractedPath,
        sourceZipPath,
      };
    }

    // Create Firestore document
    await addDoc(collection(db, "courses"), {
      title,
      description,
      features,
      interactivityLevel,
      duration,
      status: "active",
      scormVersion,
      thumbnailUrl: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      scormStructure,
    });

    revalidatePath("/repository");
    revalidatePath("/admin");

    return { success: true, courseId };
  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message || "Upload failed" };
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
  }
) {
  try {
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const courseRef = doc(db, "courses", courseId);
    await updateDoc(courseRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    revalidatePath("/repository");
    revalidatePath("/admin");

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

    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists() || userDoc.data().role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Delete course document
    await deleteDoc(doc(db, "courses", courseId));

    // Delete Storage files
    const storagePath = `scorm/${courseId}`;
    const listRef = ref(storage, storagePath);
    const { items } = await listAll(listRef);

    const deletePromises = items.map((itemRef) => deleteObject(itemRef));
    await Promise.all(deletePromises);

    revalidatePath("/repository");
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message || "Delete failed" };
  }
}
