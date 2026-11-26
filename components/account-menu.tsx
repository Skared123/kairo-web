"use client";

import { ChevronDown, CircleUser, KeyRound, LogOut, Moon, Users } from "lucide-react";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { browserApi } from "@/lib/api/browser";

const subscribe = () => () => {};

/**
 * The menu under the user's name (decision 044): who is signed in, admin and password, the language, the theme and
 * sign-out. It reads the path to change the language, so it goes behind <Suspense>.
 */
export function AccountMenu({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const t = useTranslations("AppHeader");
  const preferences = useTranslations("Preferences");
  const locales = useTranslations("Locales");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known in the browser (see ThemeSwitch).
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  async function signOut() {
    try {
      // 204, or 401 when the session had already ended: either way there is no session left.
      await browserApi.POST("/auth/sign-out");
    } finally {
      router.replace("/sign-in");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-56">
          <CircleUser aria-hidden />
          <span className="truncate max-sm:sr-only">{name}</span>
          <ChevronDown className="text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Only a shortcut: /admin/users checks the role, and so does the API. */}
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin/users">
              <Users aria-hidden />
              {t("admin")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/password">
            <KeyRound aria-hidden />
            {t("password")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {preferences("language")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(next) => hasLocale(routing.locales, next) && router.replace(pathname, { locale: next })}
        >
          {routing.locales.map((option) => (
            <DropdownMenuRadioItem key={option} value={option} lang={option}>
              {locales(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={mounted && resolvedTheme === "dark"}
          disabled={!mounted}
          // Keeps the menu open, so the theme changes in front of the user.
          onSelect={(event) => event.preventDefault()}
          onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
        >
          <Moon aria-hidden />
          {preferences("darkTheme")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
