/*
 * PROTOTYPE ROUTE — /homev2?variant=A|B|C.
 *
 * Three variants of the landing page, switchable with the bottom bar or the
 * ←/→ keys: A = the existing page (baseline), B = dark editorial index,
 * C = left-rail app shell. All three share the auth and data in
 * ./_prototype/shared.tsx. Delete ./_prototype and restore the page body from
 * git once a variant has won.
 */
import PrototypeSwitcher from "./_prototype/PrototypeSwitcher";

export default function HomeV2() {
  return <PrototypeSwitcher />;
}
