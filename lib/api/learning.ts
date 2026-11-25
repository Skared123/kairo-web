import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { LearningItem, LearningStatus, Skill } from "./types";

export type LearningFilters = { status?: LearningStatus; skillId?: string };

/** The signed-in user's learning items: the focus first, then by status. Request-time data: call it behind <Suspense>. */
export async function listLearning(filters: LearningFilters): Promise<LearningItem[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/learning", { params: { query: filters } });
  if (!data) {
    throw new Error(`GET /learning answered ${response.status}`);
  }
  return data;
}

/** One of the user's items, or null when it does not exist or belongs to someone else (404 to both). */
export async function getLearningItem(id: string): Promise<LearningItem | null> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/learning/{id}", { params: { path: { id } } });
  if (response.status === 404 || response.status === 400) {
    return null;
  }
  if (!data) {
    throw new Error(`GET /learning/${id} answered ${response.status}`);
  }
  return data;
}

/** The user's skills, by name, with how many items train each. */
export async function listSkills(): Promise<Skill[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/skills");
  if (!data) {
    throw new Error(`GET /skills answered ${response.status}`);
  }
  return data;
}
