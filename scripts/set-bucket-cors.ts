/**
 * One-off script: set CORS rules on the Firebase Storage bucket
 * so that the browser can PUT files directly via signed URLs.
 *
 * Usage:  npx tsx scripts/set-bucket-cors.ts
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "firebase-service-account.json"), "utf-8"),
);

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: bucketName,
});

const storage = getStorage(app);
const bucket = storage.bucket();

const corsConfig = [
  {
    origin: ["https://lms.edventurehub.com"],
    method: ["GET", "PUT", "POST", "HEAD", "DELETE"],
    maxAgeSeconds: 3600,
    responseHeader: [
      "Content-Type",
      "Content-Length",
      "X-Goog-Upload-Protocol",
      "X-Goog-Upload-Status",
      "X-Goog-Upload-Chunk-Granularity",
    ],
  },
];

console.log("Setting CORS on bucket:", bucket.name);
bucket.setCorsConfiguration(corsConfig).then(() => {
  console.log("✅ CORS configuration applied successfully.");
  console.log("Config:", JSON.stringify(corsConfig, null, 2));
  process.exit(0);
}).catch((err) => {
  console.error("❌ Failed to set CORS:", err);
  process.exit(1);
});
