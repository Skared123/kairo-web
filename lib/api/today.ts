import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { Today } from "./types";

/** Everything Today shows, always fresh. Request-time data: call it behind <Suspense>. */
export async function getToday(): Promise<Today> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/today");
  if (!data) {
    throw new Error(`GET /today answered ${response.status}`);
  }
  return data;
}
