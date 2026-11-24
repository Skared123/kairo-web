import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { Task } from "./types";

/**
 * The signed-in user's tasks, open first by due day, then the done ones; `jobId` keeps one job's. Always fresh.
 * Request-time data: call it behind <Suspense>.
 */
export async function listTasks(filters: { jobId?: string }): Promise<Task[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/tasks", { params: { query: filters } });
  if (!data) {
    throw new Error(`GET /tasks answered ${response.status}`);
  }
  return data;
}
