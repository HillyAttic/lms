import { NextRequest, NextResponse } from "next/server";
import { adminStorage, adminDb } from "@/lib/firebase-admin";

/**
 * Generic signed upload URL generator
 * POST /api/upload-url
 * Body: { storagePath, contentType, userId }
 * Returns: { uploadUrl, storagePath }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storagePath, contentType, userId } = body;

    if (!storagePath || !contentType || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: storagePath, contentType, userId" },
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

    // Generate signed upload URL (v4, expires in 15 minutes)
    const [uploadUrl] = await bucket.file(storagePath).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      storagePath,
    });
  } catch (error: any) {
    console.error("Upload URL generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
