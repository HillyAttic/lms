import { adminStorage } from "@/lib/firebase-admin";
import { unsignedStoragePath } from "@/lib/storage-path";

/**
 * Firebase Storage objects are private, so a plain
 * `https://storage.googleapis.com/<bucket>/<path>` URL returns 403. Anything that
 * has to be shown in the browser must go through a signed read URL instead.
 *
 * The expiry is deliberately far out: these URLs are baked into Firestore
 * documents as content, not minted per request like a download link.
 */
const SIGNED_URL_EXPIRY = "2037-12-31";

/** Sign a storage path for read access. Returns null if signing fails. */
export async function getSignedReadUrl(storagePath: string): Promise<string | null> {
  try {
    const [url] = await adminStorage.bucket().file(storagePath).getSignedUrl({
      action: "read",
      expires: SIGNED_URL_EXPIRY,
    });
    return url;
  } catch (error) {
    console.error("Failed to sign storage path:", storagePath, error);
    return null;
  }
}

/**
 * Thumbnails uploaded before the upload path was fixed were stored as public
 * `https://storage.googleapis.com/<bucket>/<path>` URLs, which never resolve
 * because the object is private. Re-sign those on read so existing courses keep
 * their image; values that are already signed (or empty) pass through untouched.
 */
export async function resolveThumbnailUrl(
  thumbnailUrl?: string | null
): Promise<string | null> {
  if (!thumbnailUrl) return null;

  const storagePath = unsignedStoragePath(thumbnailUrl);
  if (!storagePath) return thumbnailUrl; // already signed, or not our storage

  return getSignedReadUrl(storagePath);
}

/** Resolve `thumbnailUrl` in place across a list of documents. */
export async function resolveThumbnails<T extends object>(items: T[]): Promise<T[]> {
  await Promise.all(
    items.map(async (item) => {
      const row = item as { thumbnailUrl?: string | null };
      row.thumbnailUrl = await resolveThumbnailUrl(row.thumbnailUrl);
    })
  );
  return items;
}
