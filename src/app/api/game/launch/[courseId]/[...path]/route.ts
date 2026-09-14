import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { contentTypeForPath } from "@/lib/content-types";

/**
 * Serves a single file from an uploaded game package.
 * The base route redirects here with the entry file; the game's own relative
 * asset URLs land here too.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; path: string[] }> }
) {
  try {
    const { courseId, path } = await params;

    if (!courseId) {
      return new NextResponse("Missing course ID", { status: 400 });
    }

    const filePath = path && path.length > 0 ? path.join("/") : "index.html";

    // Prevent path traversal
    if (filePath.includes("..")) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    const file = adminStorage
      .bucket()
      .file(`games/${courseId}/extracted/${filePath}`);

    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse("File not found", { status: 404 });
    }

    const [content] = await file.download();

    return new NextResponse(new Uint8Array(content), {
      headers: {
        "Content-Type": contentTypeForPath(filePath),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Serve game file error:", error);
    return new NextResponse("Failed to load file", { status: 500 });
  }
}
