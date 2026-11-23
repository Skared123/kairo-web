import { ADMIN, expect, signIn, test } from "./fixtures";

test("captures a job with the whole posting", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/jobs");
  await page.getByRole("link", { name: "Nueva vacante" }).click();
  await expect(page.getByRole("heading", { name: "Nueva vacante" })).toBeVisible();

  await page.getByLabel("Empresa", { exact: true }).fill("Acme Robotics");
  await page.getByLabel("Puesto", { exact: true }).fill("Senior Fullstack Engineer");
  await page.getByLabel("Enlace", { exact: true }).fill("https://jobs.example.com/acme/123");
  await page.getByLabel("Dónde la encontraste", { exact: true }).click();
  await page.getByRole("option", { name: "LinkedIn" }).click();
  await page.getByLabel("Modalidad", { exact: true }).click();
  await page.getByRole("option", { name: "Remoto" }).click();
  await page.getByLabel("Salario mínimo", { exact: true }).fill("4000");
  await page.getByLabel("Salario máximo", { exact: true }).fill("6000");
  await page.getByLabel("Moneda", { exact: true }).fill("usd");
  await page.getByLabel("Periodo", { exact: true }).click();
  await page.getByRole("option", { name: "Al mes" }).click();
  await page.getByLabel("Descripción", { exact: true }).fill("We are looking for a senior engineer.\n\nRequirements: TypeScript, NestJS, React.");
  await page.getByLabel("Fecha", { exact: true }).fill("2026-12-01");
  await page.getByLabel("Qué hacer", { exact: true }).fill("Escribirle a la reclutadora");
  await page.getByRole("button", { name: "Guardar vacante" }).click();

  // No similar jobs yet, so it goes straight back to the list.
  await expect(page).toHaveURL(/\/es\/jobs$/);
  const row = page.getByRole("row", { name: /Acme Robotics/ });
  await expect(row).toContainText("Senior Fullstack Engineer");
  await expect(row).toContainText("1 dic 2026");
});

test("validates the job form before calling the API", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/jobs/new");

  await page.getByLabel("Salario mínimo", { exact: true }).fill("5000");
  await page.getByLabel("Enlace", { exact: true }).fill("ftp://example.com/1");
  await page.getByRole("button", { name: "Guardar vacante" }).click();

  await expect(page.getByText("Este campo es obligatorio.")).toHaveCount(2);
  await expect(page.getByText("Escribe un enlace que empiece con http:// o https://.")).toBeVisible();
  await expect(page.getByText("Un salario necesita su moneda y su periodo.")).toHaveCount(2);
  await expect(page).toHaveURL(/\/es\/jobs\/new$/);
});

test("edits a job and clears a field", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob({ company: "Acme", title: "Engineer", url: "https://jobs.example.com/1" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${id}/edit`);

  await expect(page.getByLabel("Empresa", { exact: true })).toHaveValue("Acme");
  await page.getByLabel("Puesto", { exact: true }).fill("Staff Engineer");
  await page.getByLabel("Enlace", { exact: true }).fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page).toHaveURL(/\/es\/jobs$/);
  await expect(page.getByRole("row", { name: /Acme/ })).toContainText("Staff Engineer");
  expect(await api.getJob(id)).toMatchObject({ title: "Staff Engineer", url: null });
});

test("never opens another user's job for editing", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob({ company: "Acme", title: "Engineer" });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto(`/es/jobs/${id}/edit`);
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByLabel("Empresa", { exact: true })).toHaveCount(0);
});
