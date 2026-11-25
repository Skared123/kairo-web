import type { Page } from "@playwright/test";
import { ADMIN, expect, signIn, test } from "./fixtures";

const contactsOf = (page: Page) => page.getByRole("main").getByRole("region", { name: "Contactos", exact: true });

test("links existing contacts to a job and unlinks them", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  const margaret = await api.createContact({ name: "Margaret Hamilton", company: "Acme Robotics", kind: "recruiter" });
  await api.createContact({ name: "Barbara Liskov" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${job}`);

  const contacts = contactsOf(page);
  await expect(contacts).toContainText("Sin contactos para esta vacante.");
  await contacts.getByLabel("Elige un contacto").click();
  await page.getByRole("option", { name: "Margaret Hamilton · Acme Robotics" }).click();
  await contacts.getByRole("button", { name: "Ligar", exact: true }).click();
  await expect(contacts.getByRole("link", { name: "Margaret Hamilton" })).toBeVisible();
  await expect(contacts).toContainText("Reclutador(a)");
  expect((await api.getContact(margaret)).jobs).toMatchObject([{ id: job }]);

  // A linked contact is no longer offered.
  await contacts.getByLabel("Elige un contacto").click();
  await expect(page.getByRole("option", { name: "Margaret Hamilton · Acme Robotics" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await contacts.getByRole("button", { name: "Desligar a Margaret Hamilton" }).click();
  await expect(contacts).toContainText("Sin contactos para esta vacante.");
  expect((await api.getContact(margaret)).jobs).toEqual([]);
});

test("creates a contact already linked to the job, and goes back to it", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${job}`);

  await contactsOf(page).getByRole("link", { name: "Nuevo contacto" }).click();
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Nuevo contacto" })).toBeVisible();
  await expect(main.getByText("Quedará ligado a Acme Robotics · Senior Fullstack Engineer.")).toBeVisible();
  // The job's company to start with, still editable.
  await expect(main.getByLabel("Empresa", { exact: true })).toHaveValue("Acme Robotics");
  await main.getByLabel("Nombre", { exact: true }).fill("Margaret Hamilton");
  await main.getByRole("button", { name: "Guardar contacto" }).click();

  await expect(page).toHaveURL(new RegExp(`/es/jobs/${job}$`));
  await contactsOf(page).getByRole("link", { name: "Margaret Hamilton" }).click();

  // The contact's page shows the job.
  await expect(main.getByRole("heading", { name: "Margaret Hamilton", level: 1 })).toBeVisible();
  const jobs = main.getByRole("region", { name: "Vacantes" });
  await expect(jobs.getByRole("link", { name: "Acme Robotics · Senior Fullstack Engineer" })).toBeVisible();
});

test("ignores a job that is not the user's when creating a contact", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto(`/es/contacts/new?jobId=${job}`);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Nuevo contacto" })).toBeVisible();
  // Nothing tells Grace the job exists, and her contact is saved unlinked.
  await expect(main.getByText(/Quedará ligado/)).toHaveCount(0);
  await expect(main.getByText("Acme Robotics")).toHaveCount(0);
  await main.getByLabel("Nombre", { exact: true }).fill("Barbara Liskov");
  await main.getByRole("button", { name: "Guardar contacto" }).click();
  await expect(main.getByRole("heading", { name: "Barbara Liskov", level: 1 })).toBeVisible();
  await expect(main.getByText("No está ligado a ninguna vacante.")).toBeVisible();
});
