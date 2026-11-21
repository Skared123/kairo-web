import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "./routing";

/** Picks each request's locale from the [locale] segment and loads its messages (decision 023). */
export default getRequestConfig(async ({ locale }) => {
  // Route Handlers and Server Actions pass the locale explicitly; pages and layouts read it from the URL.
  if (!locale) {
    const fromUrl = await rootParams.locale();
    if (!hasLocale(routing.locales, fromUrl)) {
      notFound();
    }
    locale = fromUrl;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
