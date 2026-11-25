import { BookUser, Briefcase, CalendarCheck, KeyRound, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { LocaleSwitcher } from "./locale-switcher";
import { SignOutButton } from "./sign-out-button";
import { ThemeSwitch } from "./theme-switch";

/** The bar on every signed-in page: the app's name, language, theme, and who is signed in. */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
      <Link href="/" className="font-semibold tracking-tight">
        Kairo
      </Link>
      <div className="flex items-center gap-4">
        {/* It reads the current path, which on routes with parameters (/jobs/[id]) is request-time data. */}
        <Suspense fallback={null}>
          <LocaleSwitcher />
        </Suspense>
        <ThemeSwitch />
        {/* Reads the session, so it streams in after the rest of the bar. */}
        <Suspense fallback={null}>
          <SignedInAs />
        </Suspense>
      </div>
    </header>
  );
}

async function SignedInAs() {
  const t = await getTranslations("AppHeader");
  // The header is on every signed-in page, /password included; the pages themselves enforce a forced change.
  const user = await requireUser({ allowPendingPasswordChange: true });
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/">
          <CalendarCheck aria-hidden />
          {t("today")}
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/jobs">
          <Briefcase aria-hidden />
          {t("jobs")}
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/contacts">
          <BookUser aria-hidden />
          {t("contacts")}
        </Link>
      </Button>
      {/* Only a shortcut: /admin/users checks the role, and so does the API. */}
      {user.role === "admin" && (
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            <Users aria-hidden />
            {t("admin")}
          </Link>
        </Button>
      )}
      <span className="text-sm text-muted-foreground" title={user.email}>
        {user.name}
      </span>
      <Button asChild variant="ghost" size="sm">
        <Link href="/password">
          <KeyRound aria-hidden />
          {t("password")}
        </Link>
      </Button>
      <SignOutButton />
    </div>
  );
}
