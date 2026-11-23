import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { Account } from "./types";

/**
 * Every account, for the admin screens. Always fresh: waits for the request (connection()) and is never cached, so a
 * change shows up on the next router.refresh(). Request-time data: call it behind <Suspense>.
 */
export async function listAccounts(): Promise<Account[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/admin/users");
  if (!data) {
    throw new Error(`GET /admin/users answered ${response.status}`);
  }
  return data;
}
