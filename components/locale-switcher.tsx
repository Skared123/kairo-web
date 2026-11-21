"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

/** Changes the language of the current page; next-intl remembers it in the NEXT_LOCALE cookie (decision 023). */
export function LocaleSwitcher() {
  const t = useTranslations("Locales");
  const label = useTranslations("Preferences")("language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div role="group" aria-label={label} className="flex items-center gap-1">
      {routing.locales.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === locale ? "secondary" : "ghost"}
          aria-pressed={option === locale}
          lang={option}
          onClick={() => router.replace(pathname, { locale: option })}
        >
          {t(option)}
        </Button>
      ))}
    </div>
  );
}
