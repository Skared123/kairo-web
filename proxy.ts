import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Sends every page request to its locale: the path's prefix, else the NEXT_LOCALE cookie, else the browser's
 * languages, else Spanish (decision 023).
 */
export default createMiddleware(routing);

export const config = {
  // Everything except /api (rewritten to the API), Next.js internals, files with an extension, and the icons and
  // manifest that app/ generates at the root.
  matcher: "/((?!api|_next|_vercel|icon|apple-icon|manifest\\.webmanifest|.*\\..*).*)",
};
