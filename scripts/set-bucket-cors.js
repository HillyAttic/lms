/**
 * One-off script: set CORS rules on the Firebase Storage bucket
 * so that the browser can PUT files directly via signed URLs.
 *
 * Usage:  node scripts/set-bucket-cors.js
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { readFileSync } = require("fs");
const { join } = require("path");

// Load env vars from .env (plain parsing for one-off script)
const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([A-Z_]+)=(.*)$/);
  if (match) {
    let value = match[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), "firebase-service-account.json"), "utf-8")
);

const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";

if (!bucketName) {
  console.error("❌ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in .env");
  process.exit(1);
}

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: bucketName,
});

const storage = getStorage(app);
const bucket = storage.bucket();

// Use wildcard origin to handle both storage.googleapis.com and bucket-specific hostnames
const corsConfig = [
  {
    origin: ["*"],
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
