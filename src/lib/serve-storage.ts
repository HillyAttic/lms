import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { adminStorage } from "@/lib/firebase-admin";
import { contentTypeForPath } from "@/lib/content-types";
import { getSignedReadUrl } from "@/lib/storage-urls";

/* The entry HTML gates the whole launch and is immutable per item, so its
   bytes live in process memory for a while: a repeat launch needs no Storage
   call at all. Bounded so a long-lived server can't grow without limit. */
const htmlCache = new Map<string, { at: number; body: Buffer; etag: string }>();
const HTML_TTL_MS = 10 * 60_000;
const MAX_HTML_ENTRIES = 200;

/**
 * Fetch one object. Signing is local and cheap, and the signed URL downloads
 * in a single Storage round trip — `file.download()` pays two (a metadata call
 * that exists only to prove the file is there, then the bytes).
 */
async function readStorageObject(storagePath: string): Promise<Buffer | null> {
  const signed = await getSignedReadUrl(storagePath);
  if (signed) {
    const response = await fetch(signed, { cache: "no-store" }).catch(
      () => null
    );
    if (response?.status === 404) return null;
    if (response?.ok) return Buffer.from(await response.arrayBuffer());
  }

  const [content] = await adminStorage
    .bucket()
    .file(storagePath)
    .download()
    .catch(() => [null]);
  return content ?? null;
}

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

  let entry = htmlCache.get(storagePath);
  if (!entry || Date.now() - entry.at > HTML_TTL_MS) {
    const content = await readStorageObject(storagePath);
    if (!content) return new NextResponse("File not found", { status: 404 });

    entry = {
      at: Date.now(),
      body: content,
      etag: `"${createHash("md5").update(content).digest("base64")}"`,
    };
    if (htmlCache.size >= MAX_HTML_ENTRIES) htmlCache.clear();
    htmlCache.set(storagePath, entry);
  }

  if (request.headers.get("if-none-match") === entry.etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: entry.etag,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse(new Uint8Array(entry.body), {
    headers: {
      "Content-Type": contentTypeForPath(storagePath),
      "Content-Length": String(entry.body.length),
      ETag: entry.etag,
      // Packages are immutable per item, so an hour of browser cache costs
      // nothing — and this file gates the package's whole boot. The ETag still
      // answers a revalidation after that with a 304.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
