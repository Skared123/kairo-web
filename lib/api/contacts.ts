import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { Contact } from "./types";

export type ContactFilters = { q?: string; jobId?: string };

/** The signed-in user's contacts, by name. Always fresh. Request-time data: call it behind <Suspense>. */
export async function listContacts(filters: ContactFilters): Promise<Contact[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/contacts", { params: { query: filters } });
  if (!data) {
    throw new Error(`GET /contacts answered ${response.status}`);
  }
  return data;
}

/** One of the user's contacts, or null when it does not exist or belongs to someone else (404 to both). */
export async function getContact(id: string): Promise<Contact | null> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/contacts/{id}", { params: { path: { id } } });
  if (response.status === 404 || response.status === 400) {
    return null;
  }
  if (!data) {
    throw new Error(`GET /contacts/${id} answered ${response.status}`);
  }
  return data;
}
