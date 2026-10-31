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

/* Read the variant on the server so the chosen layout is in the initial HTML.
 * Reading it in a client hook made the whole page client-only under Suspense,
 * which left the first paint blank until the JS bundle had downloaded. */
export default async function HomeV2({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const { variant } = await searchParams;
  return <PrototypeSwitcher variant={variant} />;
}
