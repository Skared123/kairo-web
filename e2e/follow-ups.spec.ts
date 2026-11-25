import type { Page } from "@playwright/test";
import { ADMIN, day, expect, signIn, test } from "./fixtures";

const JOB = "Acme Robotics · Senior Fullstack Engineer";
const section = (page: Page, name: RegExp) => page.getByRole("region", { name });

test("marks a follow-up done, which clears it and its note from the job", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    nextFollowUpOn: day(0),
    nextFollowUpNote: "Preguntar por la segunda ronda",
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  await expect(section(page, /^Hoy · 1$/)).toContainText("Preguntar por la segunda ronda");
  await page.getByRole("button", { name: `Hecho: seguimiento de ${JOB}` }).click();

  await expect(page.getByText("No tienes pendientes")).toBeVisible();
  expect(await api.getJob(job)).toMatchObject({ nextFollowUpOn: null, nextFollowUpNote: null });
});

test("postpones a follow-up with a quick choice, keeping its note", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    nextFollowUpOn: day(-2),
    nextFollowUpNote: "Preguntar por la segunda ronda",
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  await expect(section(page, /^Atrasado · 1$/)).toContainText(JOB);
  await page.getByRole("button", { name: `Posponer el seguimiento de ${JOB}` }).click();
  const dialog = page.getByRole("dialog", { name: "Posponer el seguimiento" });
  await expect(dialog).toContainText(JOB);
  await dialog.getByRole("button", { name: "Mañana" }).click();

  // Counted from today, not from the day it was due.
  await expect(dialog).toBeHidden();
  await expect(section(page, /^Próximos 7 días · 1$/)).toContainText("Preguntar por la segunda ronda");
  await expect(section(page, /^Atrasado/)).toHaveCount(0);
  expect(await api.getJob(job)).toMatchObject({
    nextFollowUpOn: day(1),
    nextFollowUpNote: "Preguntar por la segunda ronda",
  });
});

test("postpones a follow-up to another day, today or later", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    nextFollowUpOn: day(0),
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  await page.getByRole("button", { name: `Posponer el seguimiento de ${JOB}` }).click();
  const dialog = page.getByRole("dialog", { name: "Posponer el seguimiento" });
  const save = dialog.getByRole("button", { name: "Posponer", exact: true });

  await save.click();
  await expect(dialog.getByText("Este campo es obligatorio.")).toBeVisible();

  const otherDay = dialog.getByLabel("Otro día");
  await otherDay.fill(day(-1));
  await save.click();
  await expect(dialog.getByText("Elige hoy o un día después.")).toBeVisible();

  await otherDay.fill(day(20));
  await save.click();
  await expect(dialog).toBeHidden();

  // Further ahead than a week: in the collapsed section.
  const later = section(page, /^Más adelante · 1$/);
  await later.getByText("Más adelante · 1").click();
  await expect(later).toContainText(JOB);
  expect(await api.getJob(job)).toMatchObject({ nextFollowUpOn: day(20) });
});

test("leaves the follow-up untouched when the dialog is closed", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    nextFollowUpOn: day(0),
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  await page.getByRole("button", { name: `Posponer el seguimiento de ${JOB}` }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await expect(section(page, /^Hoy · 1$/)).toContainText(JOB);
  expect(await api.getJob(job)).toMatchObject({ nextFollowUpOn: day(0) });
});

test("takes away a follow-up whose job was deleted in another tab", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    nextFollowUpOn: day(0),
  });
  await signIn(page, ADMIN.email, ADMIN.password);
  await expect(section(page, /^Hoy · 1$/)).toContainText(JOB);

  await api.deleteJob(job);
  await page.getByRole("button", { name: `Hecho: seguimiento de ${JOB}` }).click();

  await expect(page.getByText("No tienes pendientes")).toBeVisible();
  await expect(page.getByText("Algo salió mal. Intenta de nuevo.")).toHaveCount(0);
});

const CONTACT = "Margaret Hamilton · Acme Robotics";

test("shows a contact to write to among the rest, and marks it done", async ({ page, api }) => {
  await api.setupAdmin();
  const contact = await api.createContact({
    name: "Margaret Hamilton",
    company: "Acme Robotics",
    nextFollowUpOn: day(0),
    nextFollowUpNote: "Mandarle el portafolio",
  });
  await api.createJob({ company: "Globex", title: "Backend Engineer", nextFollowUpOn: day(0) });
  await api.createTask({ title: "Preparar la entrevista técnica", dueOn: day(0) });
  await signIn(page, ADMIN.email, ADMIN.password);

  // The job's follow-up first, then the contact, then the task.
  const today = section(page, /^Hoy · 3$/);
  await expect(today.getByRole("listitem").nth(0)).toContainText("Seguimiento: Globex · Backend Engineer");
  await expect(today.getByRole("listitem").nth(1)).toContainText(`Escribirle a: ${CONTACT}`);
  await expect(today.getByRole("listitem").nth(1)).toContainText("Mandarle el portafolio");
  await expect(today.getByRole("listitem").nth(2)).toContainText("Preparar la entrevista técnica");

  await page.getByRole("button", { name: `Hecho: escribirle a ${CONTACT}` }).click();
  await expect(section(page, /^Hoy · 2$/)).not.toContainText("Margaret Hamilton");
  expect(await api.getContact(contact)).toMatchObject({ nextFollowUpOn: null, nextFollowUpNote: null });
});

test("postpones a contact's follow-up, keeping its note, and leads to the contact", async ({ page, api }) => {
  await api.setupAdmin();
  const contact = await api.createContact({
    name: "Margaret Hamilton",
    company: "Acme Robotics",
    nextFollowUpOn: day(-1),
    nextFollowUpNote: "Mandarle el portafolio",
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  await expect(section(page, /^Atrasado · 1$/)).toContainText(CONTACT);
  await page.getByRole("button", { name: `Posponer el seguimiento de ${CONTACT}` }).click();
  const dialog = page.getByRole("dialog", { name: "Posponer el seguimiento" });
  await expect(dialog).toContainText(CONTACT);
  await dialog.getByRole("button", { name: "En una semana" }).click();

  await expect(dialog).toBeHidden();
  const upcoming = section(page, /^Próximos 7 días · 1$/);
  await expect(upcoming).toContainText("Mandarle el portafolio");
  expect(await api.getContact(contact)).toMatchObject({
    nextFollowUpOn: day(7),
    nextFollowUpNote: "Mandarle el portafolio",
  });

  await upcoming.getByRole("link", { name: CONTACT }).click();
  await expect(page.getByRole("main").getByRole("heading", { name: "Margaret Hamilton", level: 1 })).toBeVisible();
});
