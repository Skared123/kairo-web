import type { Page } from "@playwright/test";
import { ADMIN, day, expect, signIn, test } from "./fixtures";

const region = (page: Page, name: string) => page.getByRole("main").getByRole("region", { name, exact: true });

test("shows how to reach a contact, their notes and their next follow-up", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createContact({
    name: "Margaret Hamilton",
    company: "Acme Robotics",
    role: "Talent Partner",
    kind: "recruiter",
    email: "margaret@example.com",
    phone: "+52 55 1234 5678",
    linkedinUrl: "https://www.linkedin.com/in/example",
    notes: "Nos conocimos en un meetup",
    nextFollowUpOn: "2026-12-01",
    nextFollowUpNote: "Mandarle el portafolio",
  });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/contacts");
  await page.getByRole("link", { name: "Margaret Hamilton" }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Margaret Hamilton", level: 1 })).toBeVisible();
  await expect(main.getByText("Acme Robotics")).toBeVisible();
  await expect(main.getByText("Talent Partner")).toBeVisible();
  await expect(main.getByText("Reclutador(a)")).toBeVisible();
  await expect(main.getByRole("link", { name: "margaret@example.com" })).toHaveAttribute(
    "href",
    "mailto:margaret@example.com",
  );
  await expect(main.getByRole("link", { name: "+52 55 1234 5678" })).toHaveAttribute("href", "tel:+525512345678");
  await expect(main.getByRole("link", { name: "Perfil de LinkedIn" })).toHaveAttribute(
    "href",
    "https://www.linkedin.com/in/example",
  );
  await expect(main.getByText("Nos conocimos en un meetup")).toBeVisible();
  await expect(main.getByText("1 dic 2026")).toBeVisible();
  await expect(main.getByText("Mandarle el portafolio")).toBeVisible();
});

test("links a contact to jobs and unlinks them", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer", status: "interviewing" });
  await api.createJob({ company: "Globex", title: "Backend Engineer" });
  const id = await api.createContact({ name: "Margaret Hamilton" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/contacts/${id}`);

  const jobs = region(page, "Vacantes");
  await expect(jobs).toContainText("No está ligado a ninguna vacante.");
  await jobs.getByLabel("Elige una vacante").click();
  await page.getByRole("option", { name: "Acme Robotics · Senior Fullstack Engineer" }).click();
  await jobs.getByRole("button", { name: "Ligar", exact: true }).click();
  await expect(jobs.getByRole("link", { name: "Acme Robotics · Senior Fullstack Engineer" })).toBeVisible();
  await expect(jobs).toContainText("Entrevistas");

  // A linked job is no longer offered; the other one is.
  await jobs.getByLabel("Elige una vacante").click();
  await expect(page.getByRole("option", { name: "Acme Robotics · Senior Fullstack Engineer" })).toHaveCount(0);
  await page.getByRole("option", { name: "Globex · Backend Engineer" }).click();
  await jobs.getByRole("button", { name: "Ligar", exact: true }).click();
  await expect(jobs.getByRole("link", { name: "Globex · Backend Engineer" })).toBeVisible();
  // Every job linked: nothing left to choose.
  await expect(jobs.getByLabel("Elige una vacante")).toHaveCount(0);

  await jobs.getByRole("button", { name: "Desligar Globex · Backend Engineer" }).click();
  await expect(jobs.getByRole("link", { name: "Globex · Backend Engineer" })).toHaveCount(0);
  expect((await api.getContact(id)).jobs).toMatchObject([{ company: "Acme Robotics" }]);

  // The job leads to its page.
  await jobs.getByRole("link", { name: "Acme Robotics · Senior Fullstack Engineer" }).click();
  await expect(page.getByRole("main").getByRole("heading", { name: "Senior Fullstack Engineer" })).toBeVisible();
});

test("logs conversations, edits and deletes them", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createContact({ name: "Margaret Hamilton" });
  await api.logInteraction(id, { occurredOn: "2026-11-02", channel: "linkedin", note: "Primer mensaje" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/contacts/${id}`);

  const log = region(page, "Conversaciones");
  await expect(log.getByRole("listitem")).toHaveCount(1);

  // Today by default; the channel is required.
  await expect(log.getByLabel("Día", { exact: true })).toHaveValue(day(0));
  await log.getByLabel("Nota", { exact: true }).fill("Hablamos del equipo y de la segunda ronda");
  await log.getByRole("button", { name: "Agregar" }).click();
  await expect(log.getByText("Este campo es obligatorio.")).toBeVisible();
  await log.getByLabel("Medio", { exact: true }).click();
  await page.getByRole("option", { name: "Llamada" }).click();
  await log.getByRole("button", { name: "Agregar" }).click();

  // Latest first, and the form is ready for the next one.
  await expect(log.getByRole("listitem")).toHaveCount(2);
  await expect(log.getByRole("listitem").first()).toContainText("Llamada");
  await expect(log.getByRole("listitem").first()).toContainText("Hablamos del equipo y de la segunda ronda");
  await expect(log.getByLabel("Nota", { exact: true })).toHaveValue("");

  // Edit the older one.
  const older = "LinkedIn · 2 nov 2026";
  await log.getByRole("button", { name: `Editar ${older}` }).click();
  const dialog = page.getByRole("dialog", { name: "Editar conversación" });
  await dialog.getByLabel("Medio", { exact: true }).click();
  await page.getByRole("option", { name: "Correo" }).click();
  await dialog.getByLabel("Nota", { exact: true }).fill("Le mandé el CV");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();
  await expect(log.getByRole("listitem").last()).toContainText("Correo · 2 nov 2026");
  await expect(log.getByRole("listitem").last()).toContainText("Le mandé el CV");

  // Delete it, after a confirmation.
  await log.getByRole("button", { name: "Borrar Correo · 2 nov 2026" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Borrar" }).click();
  await expect(log.getByRole("listitem")).toHaveCount(1);

  // The list shows the latest conversation's day.
  await page.getByRole("link", { name: "← Contactos" }).click();
  await expect(page.getByRole("row", { name: /Margaret Hamilton/ })).toContainText(
    new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${day(0)}T00:00:00Z`)),
  );
});

test("deletes a contact after a confirmation, keeping their jobs", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  const id = await api.createContact({ name: "Margaret Hamilton", jobIds: [job] });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/contacts/${id}`);

  await page.getByRole("button", { name: "Borrar", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("¿Borrar a Margaret Hamilton?");
  await expect(confirm).toContainText("Sus vacantes se quedan.");
  await confirm.getByRole("button", { name: "Borrar" }).click();

  await expect(page).toHaveURL(/\/es\/contacts$/);
  await expect(page.getByText("Aún no tienes contactos.")).toBeVisible();
  expect(await api.getJob(job)).toMatchObject({ company: "Acme Robotics" });
});
