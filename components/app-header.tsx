import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { AccountMenu } from "./account-menu";
import { MainNav, NavLinks } from "./main-nav";

/** The bar on every signed-in page: the app's name, its sections, and the account menu (decision 044). */
export function AppHeader() {
  return (
    <header className="flex items-center gap-2 border-b px-4 py-2 sm:gap-4">
      <Link href="/" className="font-semibold tracking-tight">
        Kairo
      </Link>
      {/* It reads the current path, which on routes with parameters (/jobs/[id]) is request-time data. */}
      <Suspense fallback={<NavLinks current={null} />}>
        <MainNav />
      </Suspense>
      <div className="ml-auto">
        {/* Reads the session, so it streams in after the rest of the bar. */}
        <Suspense fallback={null}>
          <Account />
        </Suspense>
      </div>
    </header>
  );
}

async function Account() {
  // The header is on every signed-in page, /password included; the pages themselves enforce a forced change.
  const user = await requireUser({ allowPendingPasswordChange: true });
  return <AccountMenu name={user.name} email={user.email} isAdmin={user.role === "admin"} />;
}
