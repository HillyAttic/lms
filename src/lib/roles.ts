export type UserRole = "admin" | "manager" | "instructor" | "learner";

/**
 * Roles allowed into the admin panel and to run its write actions.
 * A manager is an admin minus user creation — see createUser in
 * src/app/actions/user-actions.ts, which stays admin-only.
 */
export function canAccessAdminPanel(role?: string | null): boolean {
  return role === "admin" || role === "manager";
}
