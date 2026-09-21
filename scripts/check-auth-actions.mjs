/**
 * Exercises `ensureUserProfile` / `getUserRole` against real Firebase Admin.
 * Creates and deletes throwaway accounts. Run:
 *
 *   node --env-file=.env scripts/check-auth-actions.mjs
 */
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import ts from "typescript";

const app = initializeApp({
  credential: cert(JSON.parse(readFileSync("firebase-service-account.json", "utf8"))),
});
const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

const src = readFileSync("src/app/actions/auth-actions.ts", "utf8");
const js = ts
  .transpileModule(
    src
      // The imports are supplied as function params instead.
      .replace(/^import .*$/gm, "")
      .replace(/^"use server";/, ""),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  )
  .outputText.replace(/export /g, "");

// `verifyIdToken` is real; the actions run against the live project.
const { ensureUserProfile, getUserRole } = new Function(
  "adminAuth",
  "adminDb",
  "FieldValue",
  `${js}; return { ensureUserProfile, getUserRole };`,
)(adminAuth, adminDb, FieldValue);

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const tokenFor = async (uid) => {
  const custom = await adminAuth.createCustomToken(uid);
  const body = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: custom, returnSecureToken: true }),
    },
  ).then((r) => r.json());
  if (!body.idToken) throw new Error(`sign-in failed: ${JSON.stringify(body)}`);
  return body.idToken;
};

const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) process.exitCode = 1;
};

// Existing users already own the platform, so a fresh account must be a learner.
const user = await adminAuth.createUser({
  email: `auth-check-${Date.now()}@example.com`,
  password: "Test-passw0rd!",
});

try {
  const token = await tokenFor(user.uid);

  const first = await ensureUserProfile(token, "Test Person");
  check("first call creates a learner profile", first.data, { role: "learner" });
  const stored = await adminDb.doc(`users/${user.uid}`).get();
  check("profile written with the name given", stored.data().displayName, "Test Person");
  const createdAt = stored.data().createdAt;

  // The auth-state listener fires on every token refresh, so a second call
  // must not duplicate work or change the role.
  const second = await ensureUserProfile(token, "Different Name");
  check("second call is idempotent", second.data, { role: "learner" });
  const after = await adminDb.doc(`users/${user.uid}`).get();
  check("existing displayName is not overwritten", after.data().displayName, "Test Person");
  check(
    "createdAt is not refreshed",
    after.data().createdAt.seconds,
    createdAt.seconds,
  );

  check("getUserRole reads the stored role", (await getUserRole(token)).data, "learner");

  // A role written by an admin (server-side) must survive later sign-ins.
  await adminDb.doc(`users/${user.uid}`).set({ role: "manager" }, { merge: true });
  check("ensureUserProfile keeps an assigned role", (await ensureUserProfile(token)).data, {
    role: "manager",
  });
  check("getUserRole sees the assigned role", (await getUserRole(token)).data, "manager");

  // Rejected identities must not create a profile.
  const bad = await ensureUserProfile("not.a.token");
  check("garbage token is refused", bad.success, false);
  check("getUserRole refuses a garbage token", (await getUserRole("")).success, false);

  // The first-user bootstrap: on an empty `users` collection the account owns
  // the platform. The live project always has users, so the emptiness probe is
  // stubbed while `doc()`/`set()` still hit the real database.
  const freshUid = (await adminAuth.createUser({ email: `first-${Date.now()}@example.com` })).uid;
  try {
    const firstToken = await tokenFor(freshUid);
    const stubbedDb = new Proxy(adminDb, {
      get: (target, prop) =>
        prop === "collection"
          ? () => ({ limit: () => ({ get: async () => ({ empty: true }) }) })
          : target[prop],
    });
    const bootstrap = new Function(
      "adminAuth",
      "adminDb",
      "FieldValue",
      `${js}; return ensureUserProfile;`,
    )(adminAuth, stubbedDb, FieldValue);
    const result = await bootstrap(firstToken, "Founder");
    check("empty collection bootstrap grants admin", result.data, { role: "admin" });
    check(
      "bootstrap role persisted",
      (await adminDb.doc(`users/${freshUid}`).get()).data().role,
      "admin",
    );
  } finally {
    await adminDb.doc(`users/${freshUid}`).delete().catch(() => {});
    await adminAuth.deleteUser(freshUid);
  }
} finally {
  await adminDb.doc(`users/${user.uid}`).delete().catch(() => {});
  await adminAuth.deleteUser(user.uid);
  console.log("# test user removed");
}
