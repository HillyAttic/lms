import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccountPath = join(process.cwd(), "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Firebase Storage bucket name - remove protocol prefix only
// Keep .appspot.com or .firebasestorage.app as they are part of the bucket name
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
const bucketName = storageBucket
  .replace("https://", "")
  .replace("http://", "");

console.log("Initializing Firebase Admin with storage bucket:", bucketName);

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName || `${serviceAccount.project_id}.appspot.com`,
      })
    : getApps()[0];

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
export { FieldValue, Timestamp };

/**
 * Recursively converts Firestore Timestamp objects to plain serializable objects.
 * This is required because Next.js can't pass class instances from Server Components
 * to Client Components.
 */
export function serializeTimestamps(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) {
    return { seconds: obj.seconds, nanoseconds: obj.nanoseconds };
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeTimestamps);
  }
  if (typeof obj === "object" && obj.constructor?.name !== "Object") {
    // Not a plain object — return as-is (e.g. Buffer, Date, etc.)
    return obj;
  }
  if (typeof obj === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeTimestamps(value);
    }
    return result;
  }
  return obj;
}
