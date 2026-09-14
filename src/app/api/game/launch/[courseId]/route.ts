import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase-admin";

/**
 * Base route: /api/game/launch/[courseId]
 *
 * Redirects to the game's entry file so relative asset URLs inside the game
 * resolve against the right directory (the catch-all route serves them).
 * Uploaded games have no public URL — their files sit in private Storage.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    if (!courseId) {
      return new NextResponse("Missing course ID", { status: 400 });
    }

    const doc = await adminDb.collection("game_courses").doc(courseId).get();
    if (!doc.exists) {
      return new NextResponse("Game not found", { status: 404 });
    }

    const data = doc.data()!;

    // URL-type games point at an external host — hand off to it directly.
    if (data.gameType === "url" && data.gameUrl) {
      return NextResponse.redirect(data.gameUrl);
    }

    const bucket = adminStorage.bucket();
    const prefix = `games/${courseId}/extracted`;
    let entry: string = data.gameEntryFile || "index.html";

    const [entryExists] = await bucket.file(`${prefix}/${entry}`).exists();
    if (!entryExists) {
      // Older records stored only the entry file's basename, which loses any
      // subdirectory it sat in — fall back to finding the real index file.
      const [files] = await bucket.getFiles({ prefix: `${prefix}/` });
      const indexFile = files.find((file) =>
        /\/index\.html?$/i.test(file.name)
      );
      if (!indexFile) {
        return new NextResponse("Game entry file not found", { status: 404 });
      }
      entry = indexFile.name.slice(prefix.length + 1);
    }

    const base = new URL(
      `/api/game/launch/${encodeURIComponent(courseId)}/`,
      request.url
    );
    const target = new URL(
      entry.split("/").map(encodeURIComponent).join("/"),
      base
    );

    return NextResponse.redirect(target);
  } catch (error: any) {
    console.error("Game launch error:", error);
    return new NextResponse("Failed to launch game", { status: 500 });
  }
}
