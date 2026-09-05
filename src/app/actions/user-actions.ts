"use server";

import { adminDb, adminAuth, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";

export async function getUsers() {
  const snapshot = await adminDb.collection("users").get();
  return serializeTimestamps(snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })));
}

export async function getUserById(userId: string) {
  try {
    const doc = await adminDb.doc(`users/${userId}`).get();
    if (!doc.exists) {
      return { success: false, error: "User not found" };
    }
    return { success: true, data: serializeTimestamps({ id: doc.id, ...doc.data() }) };
  } catch (error: any) {
    console.error("Get user error:", error);
    return { success: false, error: error.message };
  }
}

export async function getUsersPaginated(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string
) {
  try {
    // Get all users for search (Firestore doesn't support full-text search)
    const snapshot = await adminDb.collection("users").get();
    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (role && role !== "all") {
      users = users.filter((u: any) => u.role === role);
    }

    const total = users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = users.slice(offset, offset + limit);

    return {
      success: true,
      data: serializeTimestamps(data),
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error: any) {
    console.error("Get users paginated error:", error);
    return { success: false, error: error.message };
  }
}

export async function createUser(data: {
  email: string;
  password: string;
  displayName: string;
  role: "admin" | "instructor" | "learner";
}) {
  try {
    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    // Create Firestore document
    await adminDb.doc(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: null,
      role: data.role,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: "admin" | "instructor" | "learner",
  adminUserId: string
) {
  try {
    // Verify admin
    const adminDoc = await adminDb.doc(`users/${adminUserId}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    await adminDb.doc(`users/${userId}`).update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update user role error:", error);
    return { success: false, error: error.message };
  }
}

export async function batchUpdateUserRole(
  userIds: string[],
  newRole: "admin" | "instructor" | "learner",
  adminUserId: string
) {
  try {
    // Verify admin
    const adminDoc = await adminDb.doc(`users/${adminUserId}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const batch = adminDb.batch();
    userIds.forEach((userId) => {
      const userRef = adminDb.doc(`users/${userId}`);
      batch.update(userRef, {
        role: newRole,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Batch update user role error:", error);
    return { success: false, error: error.message };
  }
}

export async function batchDeleteUsers(userIds: string[], adminUserId: string) {
  try {
    // Verify admin
    const adminDoc = await adminDb.doc(`users/${adminUserId}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const batch = adminDb.batch();
    userIds.forEach((userId) => {
      const userRef = adminDb.doc(`users/${userId}`);
      batch.delete(userRef);
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Batch delete users error:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserProgress(userId: string) {
  try {
    const snapshot = await adminDb
      .collection("progress")
      .where("userId", "==", userId)
      .get();

    const progress = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: serializeTimestamps(progress) };
  } catch (error: any) {
    console.error("Get user progress error:", error);
    return { success: false, error: error.message };
  }
}

// Toggle repository access for a user
export async function toggleRepositoryAccess(
  userId: string,
  adminUserId: string
) {
  try {
    // Verify admin
    const adminDoc = await adminDb.doc(`users/${adminUserId}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    // Get current user data
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    const currentAccess = userDoc.data()?.repositoryAccess || false;

    await adminDb.doc(`users/${userId}`).update({
      repositoryAccess: !currentAccess,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, repositoryAccess: !currentAccess };
  } catch (error: any) {
    console.error("Toggle repository access error:", error);
    return { success: false, error: error.message };
  }
}

// Batch toggle repository access
export async function batchToggleRepositoryAccess(
  userIds: string[],
  enable: boolean,
  adminUserId: string
) {
  try {
    // Verify admin
    const adminDoc = await adminDb.doc(`users/${adminUserId}`).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return { success: false, error: "Admin access required" };
    }

    const batch = adminDb.batch();
    userIds.forEach((userId) => {
      const userRef = adminDb.doc(`users/${userId}`);
      batch.update(userRef, {
        repositoryAccess: enable,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Batch toggle repository access error:", error);
    return { success: false, error: error.message };
  }
}

// Check if user has repository access
export async function checkRepositoryAccess(userId: string) {
  try {
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found", hasAccess: false };
    }

    const hasAccess = userDoc.data()?.repositoryAccess || false;
    return { success: true, hasAccess };
  } catch (error: any) {
    console.error("Check repository access error:", error);
    return { success: false, error: error.message, hasAccess: false };
  }
}
