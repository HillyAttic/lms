import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Firebase Admin is initialized lazily to avoid reading the service account
// file at import time — Vercel's build step imports API route modules for
// static page collection, where the JSON file doesn't exist on the build machine.

let _initialized = false;
let _adminDb: ReturnType<typeof getFirestore> | null = null;
let _adminAuth: ReturnType<typeof getAuth> | null = null;
let _adminStorage: ReturnType<typeof getStorage> | null = null;

function initialize() {
  if (_initialized) return;

  const { readFileSync } = require("fs");
  const { join } = require("path");

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

  _adminDb = getFirestore(app);
  _adminAuth = getAuth(app);
  _adminStorage = getStorage(app);
  _initialized = true;
}

// Proxy-based lazy exports: the underlying service is only created on first use.
function lazy<T extends object>(factory: () => T): T {
  let instance: T | null = null;
  return new Proxy({} as T, {
    get(_, prop, receiver) {
      if (!instance) instance = factory();
      const value = (instance as any)[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const adminDb = lazy(() => { initialize(); return _adminDb!; });
export const adminAuth = lazy(() => { initialize(); return _adminAuth!; });
export const adminStorage = lazy(() => { initialize(); return _adminStorage!; });
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
