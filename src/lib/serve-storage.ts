import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { adminStorage } from "@/lib/firebase-admin";
import { contentTypeForPath } from "@/lib/content-types";
import { getSignedReadUrl } from "@/lib/storage-urls";

/**
 * Serve one file out of Storage for a package launch proxy.
 *
 * HTML has to stay same-origin: the package resolves its assets relatively
 * against the document. Everything else is a leaf — a CSS file's `url()` is
 * relative to the CSS itself — so it is redirected to a signed Storage URL and
 * never passes through this server.
 *
 * The cache headers are the point: a Storyline package loads ~50 JS files, and
 * uncached each one cost two Storage round trips (exists + download).
 */
export async function serveStorageFile(
  request: Request,
  storagePath: string
): Promise<NextResponse> {
  if (storagePath.includes("..")) {
    return new NextResponse("Invalid file path", { status: 400 });
  }

  if (!/\.html?$/i.test(storagePath)) {
    const url = await getSignedReadUrl(storagePath);
    return url
      ? NextResponse.redirect(url, {
          status: 307,
          headers: { "Cache-Control": "public, max-age=86400" },
        })
      : new NextResponse("File not found", { status: 404 });
  }

  const file = adminStorage.bucket().file(storagePath);
  // One download both proves the file exists and gives the bytes; a missing
  // file rejects. The HTML is the only file that takes this path, and it is
  // the gate the whole package waits on, so it must not pay two round trips.
  const [content] = await file.download().catch(() => [null]);
  if (!content) return new NextResponse("File not found", { status: 404 });

  const etag = `"${createHash("md5").update(content).digest("base64")}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return new NextResponse(new Uint8Array(content), {
    headers: {
      "Content-Type": contentTypeForPath(storagePath),
      "Content-Length": String(content.length),
      ETag: etag,
      // Packages are immutable per item, so an hour of browser cache costs
      // nothing — and this file gates the package's whole boot. The ETag still
      // answers a revalidation after that with a 304.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
