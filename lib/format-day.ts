/**
 * A calendar day (`YYYY-MM-DD`, such as a follow-up) in the page's language, such as "1 dic 2026". A day has no time
 * zone, so it is read and written in UTC: the same text everywhere, on the server and in the browser.
 */
export function formatDay(day: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}
