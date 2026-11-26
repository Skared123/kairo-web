/** The app's sections in the header (decision 044). */
export type SectionKey = "today" | "jobs" | "contacts" | "learning";

/** Each section, with the pages that belong to it. */
export const SECTIONS: { key: SectionKey; href: string; pages: string[] }[] = [
  { key: "today", href: "/", pages: [] },
  { key: "jobs", href: "/jobs", pages: ["/jobs", "/criteria"] },
  { key: "contacts", href: "/contacts", pages: ["/contacts"] },
  { key: "learning", href: "/learning", pages: ["/learning", "/skills"] },
];

/** The section a path (without its locale) is in, or null: the password and admin pages are in none. */
export function sectionOf(pathname: string): SectionKey | null {
  if (pathname === "/") {
    return "today";
  }
  const section = SECTIONS.find(({ pages }) =>
    pages.some((page) => pathname === page || pathname.startsWith(`${page}/`)),
  );
  return section?.key ?? null;
}
