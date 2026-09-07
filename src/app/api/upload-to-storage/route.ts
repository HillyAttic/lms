import { NextRequest, NextResponse } from "next/server";
import { adminStorage, adminDb } from "@/lib/firebase-admin";
import { Readable } from "stream";

/**
 * Proxy upload endpoint: streams the file from the client to Firebase Storage.
 * POST /api/upload-to-storage
 * Content-Type: application/octet-stream (or any)
 *
 * Headers:
 *   X-Storage-Path: destination path in Firebase Storage
 *   X-Content-Type:  MIME type
 *   X-User-Id:       authenticated user UID
 *
 * Body: raw file bytes
 *
 * Returns: { success, storagePath }
 *
 * This bypasses Vercel's 4.5MB limit for the /api/upload-url route (which
 * only receives tiny JSON) while keeping the file stream under the
 * serverActions.bodySizeLimit configured in7aa7a42 (500MB).
 */

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large uploads

export async function POST(request: NextRequest) {
  try {
    const storagePath = request.headers.get("x-storage-path");
    const contentType = request.headers.get("x-content-type");
    const userId = request.headers.get("x-user-id");

    if (!storagePath || !contentType || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required headers: x-storage-path, x-content-type, x-user-id",
        },
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
    const file = bucket.file(storagePath);

    // Create a Node writable stream for Firebase Storage
    const writeStream = file.createWriteStream({
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    if (!request.body) {
      return NextResponse.json(
        { success: false, error: "No request body" },
        { status: 400 }
      );
    }

    // Convert Web ReadableStream (from Next.js request) to Node Readable stream
    const nodeStream = Readable.fromWeb(request.body as any);

    await new Promise<void>((resolve, reject) => {
      nodeStream
        .pipe(writeStream)
        .on("finish", resolve)
        .on("error", reject);
    });

    return NextResponse.json({ success: true, storagePath });
  } catch (error: any) {
    console.error("Proxy upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
