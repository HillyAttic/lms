/*
 * Route mapping between the classic tree and the new theme.
 *
 * The new theme reuses the classic screens, so their hardcoded links still
 * point at /admin, /dashboard, /courses and friends. `themedHref` resolves a
 * legacy path for whichever tree the caller is currently rendered in;
 * `remapPath` is the pure mapping used by the click guard.
 *
 * Both read `window`, so on the server they resolve to the classic path — the
 * client corrects after hydration. Event handlers (router.push) always run on
 * the client, where the mapping is exact.
 */

const NEW_THEME_PREFIXES = ["/homev2", "/coursesv2", "/adminv2"];

function isNewThemePath(pathname: string): boolean {
  return NEW_THEME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

const ROUTE_MAP: [RegExp, (path: string) => string][] = [
  [/^\/admin(?:\/|$)/, (path) => `/adminv2${path.slice("/admin".length)}`],
  [/^\/dashboard(?:\/|$)/, (path) => `/homev2${path}`],
  [/^\/courses(?:\/|$)/, (path) => `/coursesv2${path.slice("/courses".length)}`],
  [/^\/about(?:\/|$)/, () => "/homev2/about"],
  [/^\/contact(?:\/|$)/, () => "/homev2/contact"],
  [/^\/leaderboard(?:\/|$)/, () => "/homev2/leaderboard"],
  [/^\/repository(?:\/|$)/, () => "/homev2/repository"],
  [/^\/watch(?:\/|$)/, (path) => `/homev2${path}`],
  [/^\/shared(?:\/|$)/, (path) => `/homev2${path}`],
  [/^\/$/, () => "/homev2"],
];

/** Remap a legacy path for the new theme. Returns the same path when unmapped. */
export function remapPath(path: string): string {
  for (const [pattern, map] of ROUTE_MAP) {
    if (pattern.test(path)) return map(path);
  }
  return path;
}

/**
 * Resolve a legacy app path for the tree the caller is in: unchanged in the
 * classic tree, remapped in the new one.
 */
export function themedHref(path: string): string {
  if (typeof window === "undefined") return path;
  if (!isNewThemePath(window.location.pathname)) return path;
  return remapPath(path);
}
