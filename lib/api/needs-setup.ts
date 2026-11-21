import "server-only";
import { publicServerApi } from "./server";

/** Whether the first admin still has to be created. Request-time data: call it behind <Suspense>. */
export async function needsSetup(): Promise<boolean> {
  const api = await publicServerApi();
  const { data, response } = await api.GET("/auth/setup");
  if (!data) {
    throw new Error(`GET /auth/setup answered ${response.status}`);
  }
  return data.needsSetup;
}
