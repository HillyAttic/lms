/**
 * Proves the `submitRating` server action refuses every identity it cannot
 * verify, using real Firebase Admin against the project. Creates a throwaway
 * auth user (the only write) and deletes it afterwards.
 *
 *   node scripts/check-rating-auth.mjs
 */
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import ts from "typescript";

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync("firebase-service-account.json", "utf8"))),
});
const auth = getAuth(app);

// Stub `adminDb` — a call that gets past the token check would be a failure,
// and the stub throws so that shows up as one rather than a silent pass.
const src = readFileSync("src/app/actions/public-course-actions.ts", "utf8");
const body = src
  .match(/export async function submitRating[\s\S]*?\n}/)[0]
  .replace("export ", "");
// Helpers `submitRating` calls that the token gate does not depend on. They
// throw if ever reached, so a stub that would be hit reads as a failure.
const js = ts.transpileModule(
  `
async function resolveRatingTarget() { throw new Error("reached resolveRatingTarget"); }
async function aggregateRating() { throw new Error("reached aggregateRating"); }
async function publishRating() { throw new Error("reached publishRating"); }
${body}
`,
  { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
).outputText;

const adminDb = {
  doc: () => ({ get: async () => ({ data: () => ({}) }) }),
  collection: () => ({
    where: () => ({ limit: () => ({ get: async () => ({}) }) }),
    doc: () => ({ set: async () => {} }),
  }),
};

const submitRating = new Function(
  "adminDb",
  "adminAuth",
  "FieldValue",
  "revalidatePath",
  `${js}; return submitRating;`,
)(adminDb, auth, { serverTimestamp: () => null }, () => {});

const expectRejection = async (label, ...args) => {
  const result = await submitRating(...args);
  // A rejection is `success: false`; the stub would have thrown had the call
  // got as far as touching Firestore.
  const ok = result.success === false;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${result.error}`);
  if (!ok) process.exitCode = 1;
  return result;
};

// A well-formed token for a uid that does not exist.
const ghostToken = await auth.createCustomToken("ghost-uid-does-not-exist");
// A token that is structurally invalid.
const garbageToken = "not.a.token";

await expectRejection("no token", "some-course", 5, "");
await expectRejection("empty token", "some-course", 5, "   ");
await expectRejection("garbage token", "some-course", 5, garbageToken);
// `createCustomToken` output is not an ID token — a caller must not be able to
// pass one off as proof of identity.
await expectRejection("custom token is not an ID token", "some-course", 5, ghostToken);
// Validation runs before any identity is consulted, so bad input is rejected
// on its own terms.
await expectRejection("out of range value", "some-course", 9, garbageToken);
await expectRejection("non-integer value", "some-course", 4.5, garbageToken);
await expectRejection(
  "over-long review",
  "some-course",
  5,
  garbageToken,
  "x".repeat(1001),
);

// A real signed-in learner, to prove a valid token does get past the gate.
const user = await auth.createUser({
  email: `rating-check-${Date.now()}@example.com`,
  password: "Test-passw0rd!",
});

try {
  const validToken = await signInForIdToken(user.uid);
  const result = await submitRating("some-course", 5, validToken, "nice");
  // The stubs throw on any access past the gate, so reaching one proves the
  // token was accepted. Anything else means a signed-in learner was refused.
  const reachedDb = /^reached /.test(result.error || "");
  console.log(
    `${reachedDb ? "PASS" : "FAIL"} valid token passes the gate: ${result.error}`,
  );
  if (!reachedDb) process.exitCode = 1;
} finally {
  await auth.deleteUser(user.uid);
}

/** Exchanges credentials for a real ID token via the public REST endpoint. */
async function signInForIdToken(uid) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY is not set");
  const customToken = await auth.createCustomToken(uid);
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const body = await response.json();
  if (!body.idToken) throw new Error(`sign-in failed: ${JSON.stringify(body)}`);
  return body.idToken;
}
