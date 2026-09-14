/**
 * Run: node scripts/check-roles.mts
 *
 * Locks the admin-panel gate: admins and managers get in, learners and
 * instructors are bounced. A manager is an admin minus user creation — that
 * carve-out lives in user-actions.createUser, which checks for "admin" alone.
 */
import assert from "node:assert/strict";
import { canAccessAdminPanel } from "../src/lib/roles.ts";

for (const role of ["admin", "manager"]) {
  assert.equal(canAccessAdminPanel(role), true, `${role} must reach the admin panel`);
}

for (const role of ["instructor", "learner", null, undefined, ""]) {
  assert.equal(canAccessAdminPanel(role), false, `${String(role)} must not reach the admin panel`);
}

console.log("roles: ok");
