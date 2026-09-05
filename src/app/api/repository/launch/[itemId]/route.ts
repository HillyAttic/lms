import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";

/**
 * Base route: /api/repository/launch/[itemId]
 * Serves story.html by default so relative assets resolve correctly
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    if (!itemId) {
      return new NextResponse("Missing item ID", { status: 400 });
    }

    const bucket = adminStorage.bucket();
    const fullPath = `repository/${itemId}/extracted/story.html`;
    const file = bucket.file(fullPath);

    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse("Story file not found", { status: 404 });
    }

    const [content] = await file.download();

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Serve story.html error:", error);
    return new NextResponse("Failed to load story", { status: 500 });
  }
}
