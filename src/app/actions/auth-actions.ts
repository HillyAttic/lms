"use server";

import { adminAuth, adminDb, FieldValue } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/roles";

/**
 * Creates the `users/{uid}` profile for an authenticated account and returns its
 * role. Idempotent — an existing profile is returned as-is, so the auth-state
 * listener can call this on every token refresh.
 *
 * This is the only writer of the `role` field. The client cannot reach
 * `users/{uid}` at all (see firestore.rules), which is what stops a learner
 * from promoting themselves to admin.
 */
export async function ensureUserProfile(idToken: string, displayName?: string) {
  try {
    const { uid, email, name } = await adminAuth.verifyIdToken(idToken);
    const ref = adminDb.doc(`users/${uid}`);
    const existing = await ref.get();

    if (existing.exists) {
      const data = existing.data();
      // The auth-state listener can create the profile before `updateProfile`
      // has run, leaving the name blank. Fill it in, but never overwrite a name
      // that is already set.
      if (displayName && !data?.displayName) {
        await ref.set({ displayName }, { merge: true });
      }
      return { success: true, data: { role: (data?.role as UserRole) || "learner" } };
    }

    // The first account to register owns the platform. Decided here rather
    // than by the client, so it cannot be claimed by writing a role field.
    const probe = await adminDb.collection("users").limit(1).get();
    const role: UserRole = probe.empty ? "admin" : "learner";

    await ref.set({
      uid,
      email: email || "",
      displayName: displayName || name || email?.split("@")[0] || "Learner",
      role,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true, data: { role } };
  } catch (error: any) {
    console.error("Ensure user profile error:", error);
    return { success: false, error: error.message };
  }
}

/** The signed-in learner's own role, for the header and route guards. */
export async function getUserRole(idToken: string) {
  try {
    const { uid } = await adminAuth.verifyIdToken(idToken);
    const doc = await adminDb.doc(`users/${uid}`).get();
    return {
      success: true,
      data: doc.exists ? ((doc.data()?.role as UserRole) || "learner") : null,
    };
  } catch (error: any) {
    console.error("Get user role error:", error);
    return { success: false, error: error.message, data: null };
  }
}
