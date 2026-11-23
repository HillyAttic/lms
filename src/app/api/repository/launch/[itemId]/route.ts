import { NextRequest, NextResponse } from "next/server";
import { serveStorageFile } from "@/lib/serve-storage";

/**
 * Base route: /api/repository/launch/[itemId]
 * Serves story.html by default so relative assets resolve correctly.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  if (!itemId) {
    return new NextResponse("Missing item ID", { status: 400 });
  }

  try {
    return await serveStorageFile(request, `repository/${itemId}/extracted/story.html`);
  } catch (error) {
    console.error("Serve story.html error:", error);
    return new NextResponse("Failed to load story", { status: 500 });
  }
}
