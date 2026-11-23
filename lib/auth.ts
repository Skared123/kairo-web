import "server-only";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { serverApi } from "./api/server";
import type { CurrentUser } from "./api/types";

/**
 * The signed-in user, or null for a guest: the one place the web app reads the session. It asks the API every time
 * (the API decides), and the result is cached per browser only.
 *
 * Reading the session cannot be prerendered, so a component that calls this sits behind <Suspense>
 * (Cache Components, see the "Authentication with Cache Components" guide).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  "use cache: private";
  const api = await serverApi();
  const { data, response } = await api.GET("/auth/me");
  if (response.status === 401) {
    return null;
  }
  if (!data) {
    throw new Error(`GET /auth/me answered ${response.status}`);
  }
  return data;
}

/**
 * The signed-in user, or a redirect: to sign-in for a guest, and to /password while the account still uses a
 * temporary password (API decision 016). Every signed-in page calls it. Same rules as getCurrentUser(): call it
 * behind <Suspense>.
 *
 * `allowPendingPasswordChange` is for the few places that must work during a forced change, like the API's
 * @AllowPendingPasswordChange(): the change-password page itself and the header.
 */
export async function requireUser({ allowPendingPasswordChange = false } = {}): Promise<CurrentUser> {
  const user = await getCurrentUser();
  const locale = await getLocale();
  // `return` because TypeScript does not narrow on a destructured `never` function.
  if (!user) {
    return redirect({ href: "/sign-in", locale });
  }
  if (user.mustChangePassword && !allowPendingPasswordChange) {
    return redirect({ href: "/password", locale });
  }
  return user;
}

/** The signed-in admin, or a redirect home for anyone else. The API refuses non-admins too; this is the UX side. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    return redirect({ href: "/", locale: await getLocale() });
  }
  return user;
}
