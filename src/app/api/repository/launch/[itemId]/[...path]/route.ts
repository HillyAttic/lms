import { NextRequest, NextResponse } from "next/server";
import { serveStorageFile } from "@/lib/serve-storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; path: string[] }> }
) {
  const { itemId, path } = await params;
  if (!itemId) {
    return new NextResponse("Missing item ID", { status: 400 });
  }

  const filePath = path && path.length > 0 ? path.join("/") : "story.html";
  try {
    return await serveStorageFile(request, `repository/${itemId}/extracted/${filePath}`);
  } catch (error) {
    console.error("Serve SCORM file error:", error);
    return new NextResponse("Failed to load file", { status: 500 });
  }
}
