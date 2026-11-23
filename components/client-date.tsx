"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * A date in the browser's time zone and the page's language, such as "26 nov 2026, 12:00". Rendered only in the
 * browser, so the server's time zone never shows and the HTML always matches.
 */
export function ClientDate({ value }: { value: string }) {
  const locale = useLocale();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) {
    return null;
  }
  const formatted = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return <time dateTime={value}>{formatted}</time>;
}
