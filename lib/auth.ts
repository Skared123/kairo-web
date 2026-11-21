import "server-only";
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
