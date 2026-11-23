import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE } from "./lib/api/session";

const intl = createMiddleware(routing);

/** Pages a guest may open. Every other page needs a session. */
const GUEST_PAGES = ["/sign-in", "/setup"];

/**
 * Runs before every page request:
 * 1. Sends it to its locale: the path's prefix, else the NEXT_LOCALE cookie, else the browser's languages, else
 *    Spanish (decision 023).
 * 2. Sends a guest to sign-in early, from the session cookie's presence alone. This is only an optimistic check, as
 *    the Next.js authentication guide recommends: getCurrentUser() and the API make the real one.
 */
export default function proxy(request: NextRequest) {
  const response = intl(request);
  if (response.headers.has("location")) {
    return response;
  }

  const [, locale, ...rest] = request.nextUrl.pathname.split("/");
  const page = `/${rest.join("/")}`;
  if (hasLocale(routing.locales, locale) && !GUEST_PAGES.includes(page) && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, request.url));
  }
  return response;
}

export const config = {
  // Everything except /api (rewritten to the API), Next.js internals, files with an extension, and the icons and
  // manifest that app/ generates at the root.
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|manifest\\.webmanifest|.*\\..*).*)",
};
