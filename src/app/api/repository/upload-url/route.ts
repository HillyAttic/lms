import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * Generates a signed upload URL for direct browser-to-Firebase-Storage uploads.
 * Bypasses Vercel's 4.5MB body size limit by having the client upload directly.
 *
 * POST /api/repository/upload-url
 * Body: { itemId, userId }
 * Returns: { uploadUrl, sourceZipPath }
 */
export async function POST(request: NextRequest) {
  try {
    const { itemId, userId } = await request.json();

    if (!itemId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: itemId and userId" },
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

    const sourceZipPath = `repository/${itemId}/source.zip`;
    const bucket = adminStorage.bucket();

    // Generate a signed upload URL (PUT request, expires in 15 minutes)
    const [uploadUrl] = await bucket.file(sourceZipPath).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType: "application/zip",
    });

    return NextResponse.json({ success: true, uploadUrl, sourceZipPath });
  } catch (error: any) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
