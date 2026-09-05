// Script to update all existing repository items to use story.html as entry point
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { readFileSync } = require("fs");
const { join } = require("path");

const serviceAccountPath = join(process.cwd(), "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

// Check if already initialized
const app = getApps().length === 0 
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

const db = getFirestore(app);

async function fixEntryPoints() {
  console.log("Fetching all repository items...");
  const snapshot = await db.collection("repository").get();
  
  console.log(`Found ${snapshot.size} items\n`);
  
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Item: ${data.name} (ID: ${doc.id})`);
    console.log(`  Current entryPoint: ${data.entryPoint}`);
    
    if (data.entryPoint !== "story.html") {
      await doc.ref.update({ entryPoint: "story.html" });
      console.log(`  ✓ Updated to story.html\n`);
      updated++;
    } else {
      console.log(`  Already correct\n`);
    }
  }
  
  console.log(`✓ Done! Updated ${updated} items`);
  process.exit(0);
}

fixEntryPoints().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
