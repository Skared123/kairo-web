"use client";

import { BookUser, Briefcase, CalendarCheck, GraduationCap, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { SECTIONS, sectionOf, type SectionKey } from "@/lib/sections";

/** Each section's icon. */
const ICONS: Record<SectionKey, LucideIcon> = {
  today: CalendarCheck,
  jobs: Briefcase,
  contacts: BookUser,
  learning: GraduationCap,
};

/** The sections, with the current one marked. It reads the path, so it goes behind <Suspense>. */
export function MainNav() {
  return <NavLinks current={sectionOf(usePathname())} />;
}

/** The links themselves; on a phone, icons only, their names kept for screen readers. */
export function NavLinks({ current }: { current: SectionKey | null }) {
  const t = useTranslations("AppHeader");
  return (
    <nav aria-label={t("nav")} className="flex items-center gap-1">
      {SECTIONS.map(({ key, href }) => {
        const Icon = ICONS[key];
        return (
          <Button key={key} asChild variant={key === current ? "secondary" : "ghost"} size="sm">
            <Link href={href} aria-current={key === current ? "page" : undefined}>
              <Icon aria-hidden />
              <span className="max-md:sr-only">{t(key)}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
