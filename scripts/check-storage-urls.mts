/**
 * Run: node scripts/check-storage-urls.mts
 *
 * Guards the legacy-thumbnail rewrite: thumbnails stored before the fix are
 * plain `storage.googleapis.com/<bucket>/<path>` URLs that must be re-signed
 * from their object path, while already-signed URLs and other hosts must pass
 * through untouched.
 */
import assert from "node:assert/strict";
import { unsignedStoragePath } from "../src/lib/storage-path.ts";

const BUCKET = "lms-edventurehub.firebasestorage.app";

// A legacy public URL yields its object path, minus the bucket segment.
assert.equal(
  unsignedStoragePath(`https://storage.googleapis.com/${BUCKET}/thumbnails/video_1/thumbnail.jpg`),
  "thumbnails/video_1/thumbnail.jpg"
);

// Nested path — only the bucket segment is dropped, not the directories.
assert.equal(
  unsignedStoragePath(`https://storage.googleapis.com/${BUCKET}/thumbnails/game_9/a/b.png`),
  "thumbnails/game_9/a/b.png"
);

// Query string and fragment must not leak into the object path.
assert.equal(
  unsignedStoragePath(`https://storage.googleapis.com/${BUCKET}/thumbnails/x/t.jpg?alt=media#frag`),
  "thumbnails/x/t.jpg"
);

// Already signed: V4 signatures live on the same host, so the signature query
// param is what tells us to leave it alone.
assert.equal(
  unsignedStoragePath(
    `https://storage.googleapis.com/${BUCKET}/thumbnails/x/t.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Expires=1&X-Goog-Signature=abc`
  ),
  null
);

// Lookalike host must not match — "firebasestorage.googleapis.com" contains
// "storage.googleapis.com".
assert.equal(
  unsignedStoragePath("https://firebasestorage.googleapis.com/v0/b/x/o/y?alt=media"),
  null
);

assert.equal(unsignedStoragePath(""), null);

console.log("storage url checks passed");
