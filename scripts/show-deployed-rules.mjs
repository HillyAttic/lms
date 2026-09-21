/**
 * Prints the Firestore ruleset currently deployed to a project, so a deploy can
 * be diffed against local before it overwrites production.
 *
 *   node scripts/show-deployed-rules.mjs [projectId]
 */
import { readFileSync } from "node:fs";
import { JWT } from "google-auth-library";

const projectId =
  process.argv[2] ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  JSON.parse(readFileSync("firebase-service-account.json", "utf8")).project_id;

const key = JSON.parse(readFileSync("firebase-service-account.json", "utf8"));
const client = new JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const { token } = await client.getAccessToken();

const base = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;
const auth = { Authorization: `Bearer ${token}` };

const release = await fetch(`${base}/releases/cloud.firestore`, {
  headers: auth,
}).then((r) => r.json());

if (!release.rulesetName) {
  console.error("No deployed ruleset found:", JSON.stringify(release, null, 2));
  process.exit(1);
}

const ruleset = await fetch(
  `https://firebaserules.googleapis.com/v1/${release.rulesetName}`,
  { headers: auth },
).then((r) => r.json());

console.error(`# project ${projectId}`);
console.error(`# ruleset ${release.rulesetName}`);
console.error(`# updated ${release.updateTime}`);
console.log(ruleset.source.files[0].content);
