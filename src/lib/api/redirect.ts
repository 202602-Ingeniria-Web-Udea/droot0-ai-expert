import { getSafeReturnTo } from "@/lib/utils/return-to";

/** Login URL that returns to `returnTo` afterwards. Only internal paths survive. */
export function buildLoginUrl(returnTo: string) {
  const params = new URLSearchParams({ returnTo: getSafeReturnTo(returnTo) });
  return `/login?${params.toString()}`;
}

/**
 * Sends the browser to the login page, remembering the current location.
 * Used when the backend answers 401 because the session ended.
 */
export function redirectToLogin() {
  const { pathname, search } = window.location;
  window.location.assign(buildLoginUrl(`${pathname}${search}`));
}
