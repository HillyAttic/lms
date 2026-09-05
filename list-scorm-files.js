// Script to list all files in the extracted SCORM package
const { initializeApp, cert } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { readFileSync } = require("fs");
const { join } = require("path");

const serviceAccountPath = join(process.cwd(), "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "lms-edventurehub.appspot.com",
});

const storage = getStorage(app);
const bucket = storage.bucket();

async function listFiles() {
  console.log("Listing files in: repository/repo_1788608165539/extracted/\n");
  
  const [files] = await bucket.getFiles({
    prefix: "repository/repo_1788608165539/extracted/",
  });
  
  console.log(`Found ${files.length} files:\n`);
  
  files.forEach((file) => {
    const fileName = file.name.replace("repository/repo_1788608165539/extracted/", "");
    if (fileName) {
      console.log(`  ${fileName}`);
    }
  });
  
  // Look for HTML files specifically
  console.log("\n\nHTML files:");
  const htmlFiles = files.filter(f => f.name.toLowerCase().endsWith(".html"));
  htmlFiles.forEach((file) => {
    const fileName = file.name.replace("repository/repo_1788608165539/extracted/", "");
    console.log(`  ✓ ${fileName}`);
  });
  
  process.exit(0);
}

listFiles().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
