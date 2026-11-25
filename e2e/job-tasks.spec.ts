import type { Page } from "@playwright/test";
import { ADMIN, day, expect, signIn, test } from "./fixtures";

const JOB = "Acme Robotics · Senior Fullstack Engineer";
const tasksOf = (page: Page) => page.getByRole("main").getByRole("region", { name: "Tareas" });

test("shows only the job's tasks, open ones first and done ones collapsed", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  const other = await api.createJob({ company: "Globex", title: "Backend Engineer" });
  await api.createTask({ title: "Preparar la entrevista técnica", dueOn: "2026-12-01", jobId: job });
  const done = await api.createTask({ title: "Mandar el CV", jobId: job });
  await api.updateTask(done, { done: true });
  await api.createTask({ title: "Investigar a Globex", jobId: other });
  await api.createTask({ title: "Escribir un post en LinkedIn" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${job}`);

  const tasks = tasksOf(page);
  await expect(tasks.getByRole("listitem")).toHaveCount(1);
  await expect(tasks.getByRole("listitem")).toContainText("Preparar la entrevista técnica");
  await expect(tasks.getByRole("listitem")).toContainText("1 dic 2026");
  // The job is this page: no link back to it.
  await expect(tasks.getByRole("link", { name: JOB })).toHaveCount(0);
  await expect(tasks).not.toContainText("Investigar a Globex");
  await expect(tasks).not.toContainText("Escribir un post en LinkedIn");

  await expect(tasks.getByText("Mandar el CV")).toBeHidden();
  await tasks.getByText("Terminadas · 1").click();
  await expect(tasks.getByText("Mandar el CV")).toBeVisible();
});

test("adds a task already linked to the job, and completes it there", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${job}`);

  const tasks = tasksOf(page);
  await expect(tasks).toContainText("Todavía no hay tareas para esta vacante.");
  // No job to choose: it is this one.
  await expect(tasks.getByLabel("Vacante", { exact: true })).toHaveCount(0);
  await tasks.getByLabel("Tarea", { exact: true }).fill("Preparar la entrevista técnica");
  await tasks.getByLabel("Fecha", { exact: true }).fill(day(0));
  await tasks.getByRole("button", { name: "Agregar" }).click();
  await expect(tasks.getByRole("listitem")).toContainText("Preparar la entrevista técnica");

  await tasks.getByRole("checkbox", { name: "Marcar como hecha: Preparar la entrevista técnica" }).click();
  await expect(tasks.getByText("Terminadas · 1")).toBeVisible();
  await expect(tasks).toContainText("Todavía no hay tareas para esta vacante.");

  // Today shows it done, linked to the job.
  await page.getByRole("link", { name: "Hoy" }).click();
  const doneToday = page.getByRole("region", { name: /^Terminadas hoy · 1$/ });
  await doneToday.getByText("Terminadas hoy · 1").click();
  await expect(doneToday.getByRole("link", { name: JOB })).toBeVisible();
});

test("keeps the job's tasks, without a job, when the job is deleted", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  const task = await api.createTask({ title: "Preparar la entrevista técnica", jobId: job });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${job}`);

  await page.getByRole("button", { name: "Borrar", exact: true }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("Sus tareas y contactos se quedan, sin la vacante.");
  await confirm.getByRole("button", { name: "Borrar", exact: true }).click();
  await expect(page).toHaveURL(/\/es\/jobs$/);

  expect(await api.getTask(task)).toMatchObject({ title: "Preparar la entrevista técnica", job: null });
  await page.getByRole("link", { name: "Hoy" }).click();
  await expect(page.getByRole("region", { name: /^Sin fecha · 1$/ })).toContainText("Preparar la entrevista técnica");
});
