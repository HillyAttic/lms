export type UserRole = "admin" | "manager" | "learner";

/**
 * Roles allowed into the admin panel and to run its write actions.
 * Hierarchy: an admin (superuser) manages managers; a manager manages only the
 * learners they created (see canManageUser in src/app/actions/user-actions.ts).
 */
export function canAccessAdminPanel(role?: string | null): boolean {
  return role === "admin" || role === "manager";
}
