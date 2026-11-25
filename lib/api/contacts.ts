import "server-only";
import { connection } from "next/server";
import { serverApi } from "./server";
import type { Contact, Interaction } from "./types";

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

/** The conversations with one of the user's contacts, latest first. Call it after getContact() found the contact. */
export async function listInteractions(contactId: string): Promise<Interaction[]> {
  await connection();
  const api = await serverApi();
  const { data, response } = await api.GET("/contacts/{contactId}/interactions", {
    params: { path: { contactId } },
  });
  if (!data) {
    throw new Error(`GET /contacts/${contactId}/interactions answered ${response.status}`);
  }
  return data;
}
