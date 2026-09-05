import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string; path: string[] }> }
) {
  try {
    const { itemId, path } = await params;

    if (!itemId) {
      return new NextResponse("Missing item ID", { status: 400 });
    }

    // Build the file path from segments
    const filePath = path && path.length > 0 ? path.join("/") : "story.html";

    // Prevent path traversal
    if (filePath.includes("..")) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    const bucket = adminStorage.bucket();
    const fullPath = `repository/${itemId}/extracted/${filePath}`;
    const file = bucket.file(fullPath);

    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse("File not found", { status: 404 });
    }

    const [content] = await file.download();

    // Determine content type from extension
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentTypes: Record<string, string> = {
      html: "text/html; charset=utf-8",
      htm: "text/html; charset=utf-8",
      js: "application/javascript",
      css: "text/css",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      ico: "image/x-icon",
      xml: "application/xml",
      mp4: "video/mp4",
      webm: "video/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      pdf: "application/pdf",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      eot: "application/vnd.ms-fontobject",
    };

    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Serve SCORM file error:", error);
    return new NextResponse("Failed to load file", { status: 500 });
  }
}
