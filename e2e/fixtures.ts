import { test as base, expect, request, type APIRequestContext, type Page } from "@playwright/test";
import { Client } from "pg";
import { API_URL } from "./env";
import { resetDatabase, testDatabaseUrl } from "./test-database";

export { expect };

/** A calendar day `offset` days from today, in this machine's time zone: the browser's, as Today reads it. */
export function day(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const ADMIN = { name: "Ada Lovelace", email: "ada@example.com", password: "abc123" };

/** Every test starts from a fresh install: an empty kairo_test. */
export const test = base.extend<{ api: Api }>({
  // Playwright calls the second argument `use`; renamed so the React hooks lint rule does not mistake it for a hook.
  api: async ({}, provide) => {
    await resetDatabase();
    const api = new Api(await request.newContext({ baseURL: API_URL }));
    await provide(api);
    await api.dispose();
  },
});

/** Prepares data straight through the API, so each test only clicks through what it checks. */
export class Api {
  constructor(private readonly context: APIRequestContext) {}

  /** Creates the first admin; the context keeps its session for admin calls. */
  async setupAdmin(): Promise<void> {
    const res = await this.context.post("/auth/setup", { data: ADMIN });
    expect(res.status()).toBe(201);
  }

  /** Creates an account as the admin and returns its temporary password. */
  async createAccount(name: string, email: string, role: "user" | "admin" = "user"): Promise<string> {
    const res = await this.context.post("/admin/users", { data: { name, email, role } });
    expect(res.status()).toBe(201);
    return (await res.json()).temporaryPassword;
  }

  /** Changes an account's password from its temporary one, in a context of its own. */
  async choosePassword(email: string, temporaryPassword: string, newPassword: string): Promise<void> {
    const user = await request.newContext({ baseURL: API_URL });
    expect((await user.post("/auth/sign-in", { data: { email, password: temporaryPassword } })).status()).toBe(200);
    const res = await user.post("/auth/password", { data: { currentPassword: temporaryPassword, newPassword } });
    expect(res.status()).toBe(200);
    await user.dispose();
  }

  /** Creates a job for the signed-in admin and returns its id. */
  async createJob(fields: Record<string, unknown>): Promise<string> {
    const res = await this.context.post("/jobs", { data: fields });
    expect(res.status()).toBe(201);
    return (await res.json()).id;
  }

  /** Reads one of the signed-in admin's jobs. */
  async getJob(id: string): Promise<Record<string, unknown>> {
    const res = await this.context.get(`/jobs/${id}`);
    expect(res.status()).toBe(200);
    return res.json();
  }

  /** Deletes one of the signed-in admin's jobs, as another tab would. */
  async deleteJob(id: string): Promise<void> {
    expect((await this.context.delete(`/jobs/${id}`)).status()).toBe(204);
  }

  /** Creates a task for the signed-in admin and returns its id. */
  async createTask(fields: Record<string, unknown>): Promise<string> {
    const res = await this.context.post("/tasks", { data: fields });
    expect(res.status()).toBe(201);
    return (await res.json()).id;
  }

  /** Reads one of the signed-in admin's tasks. */
  async getTask(id: string): Promise<Record<string, unknown>> {
    const res = await this.context.get(`/tasks/${id}`);
    expect(res.status()).toBe(200);
    return res.json();
  }

  /** Changes one of the signed-in admin's tasks, such as `{ done: true }`. */
  async updateTask(id: string, changes: Record<string, unknown>): Promise<void> {
    expect((await this.context.patch(`/tasks/${id}`, { data: changes })).status()).toBe(200);
  }

  /** Deletes one of the signed-in admin's tasks, as another tab would. */
  async deleteTask(id: string): Promise<void> {
    expect((await this.context.delete(`/tasks/${id}`)).status()).toBe(204);
  }

  /** Creates a contact for the signed-in admin and returns its id. */
  async createContact(fields: Record<string, unknown>): Promise<string> {
    const res = await this.context.post("/contacts", { data: fields });
    expect(res.status()).toBe(201);
    return (await res.json()).id;
  }

  /** Reads one of the signed-in admin's contacts. */
  async getContact(id: string): Promise<Record<string, unknown>> {
    const res = await this.context.get(`/contacts/${id}`);
    expect(res.status()).toBe(200);
    return res.json();
  }

  /** Deletes one of the signed-in admin's contacts, as another tab would. */
  async deleteContact(id: string): Promise<void> {
    expect((await this.context.delete(`/contacts/${id}`)).status()).toBe(204);
  }

  /** Logs a conversation with one of the signed-in admin's contacts. */
  async logInteraction(contactId: string, fields: Record<string, unknown>): Promise<void> {
    expect((await this.context.post(`/contacts/${contactId}/interactions`, { data: fields })).status()).toBe(201);
  }

  /** Saves the signed-in admin's criteria. */
  async saveCriteria(criteria: Record<string, unknown>): Promise<void> {
    expect((await this.context.put("/criteria", { data: criteria })).status()).toBe(200);
  }

  dispose(): Promise<void> {
    return this.context.dispose();
  }
}

/** Makes an account's temporary password past its 72 hours (API decision 026), standing in for the clock. */
export async function expireTemporaryPassword(email: string): Promise<void> {
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  try {
    await client.query(
      `UPDATE users SET temporary_password_expires_at = now() - interval '1 minute' WHERE email = $1`,
      [email],
    );
  } finally {
    await client.end();
  }
}

/** Signs in through the Spanish sign-in screen, and waits for the API's answer (the session cookie, on success). */
export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/es/sign-in");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  const answered = page.waitForResponse((res) => res.url().endsWith("/api/auth/sign-in"));
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await answered;
}
