"use server";

import { adminDb, adminAuth, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";
import { canAccessAdminPanel, type UserRole } from "@/lib/roles";

// Admin or manager.
async function isStaffUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const doc = await adminDb.doc(`users/${userId}`).get();
  return doc.exists && canAccessAdminPanel(doc.data()?.role);
}

/**
 * Hierarchy guard. Admins manage everyone; a manager manages only the learners
 * they created (`createdBy` is stamped by createUser).
 */
async function canManageUser(callerId: string, targetId: string): Promise<boolean> {
  if (!callerId) return false;
  const callerRole = (await adminDb.doc(`users/${callerId}`).get()).data()?.role;
  if (callerRole === "admin") return true;
  if (callerRole !== "manager") return false;
  const target = await adminDb.doc(`users/${targetId}`).get();
  return (
    target.exists &&
    target.data()?.role === "learner" &&
    target.data()?.createdBy === callerId
  );
}

export async function getUsers() {
  const snapshot = await adminDb.collection("users").get();
  return serializeTimestamps(snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })));
}

export async function getUserById(userId: string, viewerId?: string) {
  try {
    if (viewerId && !(await canManageUser(viewerId, userId))) {
      return { success: false, error: "You can only view learners you created" };
    }
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
  role?: string,
  viewerId?: string,
  createdBy?: string
) {
  try {
    // Get all users for search (Firestore doesn't support full-text search)
    const snapshot = await adminDb.collection("users").get();
    let users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Only admins see admin accounts; managers see only the learners they created.
    const viewerRole = viewerId
      ? (await adminDb.doc(`users/${viewerId}`).get()).data()?.role
      : null;
    if (viewerRole !== "admin") {
      users = users.filter((u: any) => u.role !== "admin");
    }
    if (viewerRole === "manager") {
      users = users.filter((u: any) => u.createdBy === viewerId);
    }
    if (createdBy && createdBy !== "all") {
      users = users.filter((u: any) => u.createdBy === createdBy);
    }

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

/** Admin-only list of managers, used to browse learners under each manager. */
export async function getManagers(viewerId: string) {
  try {
    const viewerRole = (await adminDb.doc(`users/${viewerId}`).get()).data()?.role;
    if (viewerRole !== "admin") {
      return { success: false, error: "Admin access required" };
    }
    const snapshot = await adminDb.collection("users").get();
    const managers = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as any))
      .filter((u) => u.role === "manager")
      .map((u) => ({
        id: u.id,
        displayName: u.displayName || "",
        email: u.email || "",
      }));
    return { success: true, data: managers };
  } catch (error: any) {
    console.error("Get managers error:", error);
    return { success: false, error: error.message };
  }
}

export async function createUser(
  data: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  },
  adminUserId: string
) {
  try {
    // Admins create any role; managers create learners under themselves only.
    const callerDoc = await adminDb.doc(`users/${adminUserId}`).get();
    const callerRole = callerDoc.exists ? callerDoc.data()?.role : null;
    if (!canAccessAdminPanel(callerRole)) {
      return { success: false, error: "Admin access required" };
    }
    if (callerRole !== "admin" && data.role !== "learner") {
      return { success: false, error: "Managers can only create learners" };
    }

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
      createdBy: adminUserId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    displayName?: string;
    role?: UserRole;
  },
  adminUserId: string
) {
  try {
    if (!(await canManageUser(adminUserId, userId))) {
      return { success: false, error: "You can only manage learners you created" };
    }

    // Role changes are admin-only; a manager cannot promote their learners.
    if (data.role !== undefined) {
      const callerRole = (await adminDb.doc(`users/${adminUserId}`).get()).data()?.role;
      const targetRole = (await adminDb.doc(`users/${userId}`).get()).data()?.role;
      if (callerRole !== "admin" && data.role !== targetRole) {
        return { success: false, error: "Only admins can change roles" };
      }
    }

    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    await adminDb.doc(`users/${userId}`).update(updateData);

    return { success: true };
  } catch (error: any) {
    console.error("Update user profile error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  adminUserId: string
) {
  return updateUserProfile(userId, { role: newRole }, adminUserId);
}

export async function batchUpdateUserRole(
  userIds: string[],
  newRole: UserRole,
  adminUserId: string
) {
  try {
    if (!(await isStaffUser(adminUserId))) {
      return { success: false, error: "Admin access required" };
    }

    // Role changes are admin-only.
    const callerRole = (await adminDb.doc(`users/${adminUserId}`).get()).data()?.role;
    if (callerRole !== "admin") {
      return { success: false, error: "Only admins can change roles" };
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
    if (!(await isStaffUser(adminUserId))) {
      return { success: false, error: "Admin access required" };
    }
    const allowed = await Promise.all(userIds.map((id) => canManageUser(adminUserId, id)));
    if (!allowed.every(Boolean)) {
      return { success: false, error: "You can only manage learners you created" };
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

export async function deleteUser(userId: string, adminUserId: string) {
  try {
    if (!(await canManageUser(adminUserId, userId))) {
      return { success: false, error: "You can only manage learners you created" };
    }

    // Check if user exists
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    // Delete the user document
    await adminDb.doc(`users/${userId}`).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Delete user error:", error);
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
    if (!(await canManageUser(adminUserId, userId))) {
      return { success: false, error: "You can only manage learners you created" };
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
    if (!(await isStaffUser(adminUserId))) {
      return { success: false, error: "Admin access required" };
    }
    const allowed = await Promise.all(userIds.map((id) => canManageUser(adminUserId, id)));
    if (!allowed.every(Boolean)) {
      return { success: false, error: "You can only manage learners you created" };
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

// Update a user's password via Firebase Admin SDK
export async function updateUserPassword(
  userId: string,
  newPassword: string,
  adminUserId: string
) {
  try {
    if (!(await canManageUser(adminUserId, userId))) {
      return { success: false, error: "You can only manage learners you created" };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    // Update password in Firebase Auth
    await adminAuth.updateUser(userId, {
      password: newPassword,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update user password error:", error);
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
