import "server-only";
import { cookies } from "next/headers";
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
