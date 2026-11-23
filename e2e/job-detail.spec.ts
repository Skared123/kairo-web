import { ADMIN, expect, signIn, test } from "./fixtures";

const POSTING = {
  company: "Acme Robotics",
  title: "Senior Fullstack Engineer",
  url: "https://jobs.example.com/acme/123",
  workMode: "remote",
  salaryMin: 4000,
  salaryMax: 6000,
  salaryCurrency: "USD",
  salaryPeriod: "month",
  description: "We are looking for a senior engineer.\nRequirements: TypeScript, NestJS, React.",
  nextFollowUpOn: "2026-12-01",
  nextFollowUpNote: "Escribirle a la reclutadora",
};

test("opens a job from the list and shows everything saved about it", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob(POSTING);
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/jobs");
  await page.getByRole("link", { name: "Senior Fullstack Engineer" }).click();

  // The visible page only: Next.js keeps the list it came from mounted but hidden.
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Senior Fullstack Engineer" })).toBeVisible();
  await expect(main.getByText("Requirements: TypeScript, NestJS, React.")).toBeVisible();
  await expect(main.getByText("Remoto")).toBeVisible();
  await expect(main.getByText(/4[\s.,]?000/)).toBeVisible();
  await expect(main.getByText("1 dic 2026")).toBeVisible();
  await expect(main.getByText("Escribirle a la reclutadora")).toBeVisible();
  await expect(main.getByRole("link", { name: "Ver publicación" })).toHaveAttribute("href", POSTING.url);
  await expect(main.getByText("Guardada en Por revisar")).toBeVisible();
});

test("moves the job to another stage and adds it to the history", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob(POSTING);
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${id}`);

  await page.getByLabel("Etapa", { exact: true }).click();
  await page.getByRole("option", { name: "Aplicada" }).click();

  const history = page.getByRole("listitem").filter({ has: page.getByLabel("a", { exact: true }) });
  await expect(history).toHaveCount(1);
  await expect(history.first()).toContainText("Por revisar");
  await expect(history.first()).toContainText("Aplicada");
  expect(await api.getJob(id)).toMatchObject({ status: "applied" });
});

test("edits from the job's page and comes back to it", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob(POSTING);
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${id}`);

  await page.getByRole("link", { name: "Editar" }).click();
  await page.getByLabel("Puesto", { exact: true }).fill("Staff Engineer");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page).toHaveURL(new RegExp(`/es/jobs/${id}$`));
  await expect(page.getByRole("heading", { name: "Staff Engineer" })).toBeVisible();
});

test("deletes a job after a confirmation", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob(POSTING);
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${id}`);

  await page.getByRole("button", { name: "Borrar" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("¿Borrar Acme Robotics · Senior Fullstack Engineer?");
  await confirm.getByRole("button", { name: "Borrar" }).click();

  await expect(page).toHaveURL(/\/es\/jobs$/);
  await expect(page.getByText("Aún no tienes vacantes.")).toBeVisible();
});

test("never opens another user's job", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob(POSTING);
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto(`/es/jobs/${id}`);
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByText("Requirements: TypeScript")).toHaveCount(0);
});
