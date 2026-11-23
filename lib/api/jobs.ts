import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { Job, JobSort, JobStatus } from "./types";

export type JobFilters = { status?: JobStatus; q?: string; sort?: JobSort };

/**
 * The signed-in user's jobs, filtered and sorted by the API. Always fresh (connection(), never cached), so a change
 * shows up on the next router.refresh(). Request-time data: call it behind <Suspense>.
 */
export async function listJobs(filters: JobFilters): Promise<Job[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/jobs", { params: { query: filters } });
  if (!data) {
    throw new Error(`GET /jobs answered ${response.status}`);
  }
  return data;
}
