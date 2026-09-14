// Anchored so a lookalike host (`firebasestorage.googleapis.com/…`) can't match.
const LEGACY_PUBLIC_URL = /^https?:\/\/storage\.googleapis\.com\/([^/?#]+)\/([^?#]+)/i;

/**
 * Thumbnails uploaded before the upload path was fixed were stored as plain
 * `https://storage.googleapis.com/<bucket>/<path>` URLs, which never resolve
 * because the object is private.
 *
 * Return the object path from one of those — or null when there is nothing to
 * re-sign: the value is empty, belongs to another host, or is already signed
 * (V4 signed URLs share the same host, so the signature is what distinguishes
 * them). Kept dependency-free so `scripts/check-storage-urls.ts` can run it.
 */
export function unsignedStoragePath(url: string): string | null {
  if (url.includes("X-Goog-Signature=")) return null;

  const match = LEGACY_PUBLIC_URL.exec(url);
  return match ? match[2] : null;
}
