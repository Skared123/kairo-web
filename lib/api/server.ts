import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { SESSION_COOKIE } from "./session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

/**
 * The API client for Server Components: it calls the API directly and forwards only this request's session cookie,
 * never the other incoming headers (decision 018). Reads cookies(), so whatever uses it renders at request time.
 */
export async function serverApi() {
  const session = (await cookies()).get(SESSION_COOKIE);
  return createClient<paths>({
    baseUrl: API_URL,
    headers: session ? { cookie: `${SESSION_COOKIE}=${session.value}` } : {},
    // Every answer depends on who is asking: never let fetch reuse one.
    cache: "no-store",
  });
}

/**
 * The API client for public endpoints, which need no session. It sends no cookie at all. Waits for the request
 * (connection()), so the answer is never baked into a prerendered page.
 */
export async function publicServerApi() {
  await connection();
  return createClient<paths>({ baseUrl: API_URL, cache: "no-store" });
}
