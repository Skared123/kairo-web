import { defineRouting } from "next-intl/routing";

/** The app's languages; every route starts with one of them (decision 023). */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // Remember the language the user picks for a year (the default cookie ends with the browser session).
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});
