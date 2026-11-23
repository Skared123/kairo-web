import { Suspense } from "react";
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
        <LocaleSwitcher />
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
  const user = await requireUser();
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground" title={user.email}>
        {user.name}
      </span>
      <SignOutButton />
    </div>
  );
}
