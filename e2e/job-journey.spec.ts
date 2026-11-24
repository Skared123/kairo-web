import { ADMIN, expect, signIn, test } from "./fixtures";

/** Stage changes in the history: the entries with an arrow, so not the first one ("Guardada en…"). */
function stageChanges(page: import("@playwright/test").Page) {
  return page.getByRole("main").getByRole("listitem").filter({ has: page.getByLabel("a", { exact: true }) });
}

test("follows a job from capture to an offer", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);

  // Capture it.
  await page.goto("/es/jobs/new");
  await page.getByLabel("Empresa", { exact: true }).fill("Acme Robotics");
  await page.getByLabel("Puesto", { exact: true }).fill("Senior Fullstack Engineer");
  await page.getByRole("button", { name: "Guardar vacante" }).click();
  await expect(page).toHaveURL(/\/es\/jobs$/);

  // Open it from the list and move it through three stages, one at a time.
  await page.getByRole("link", { name: "Senior Fullstack Engineer" }).click();
  const main = page.getByRole("main");
  await expect(main.getByText("Guardada en Por revisar")).toBeVisible();
  for (const [index, stage] of ["Aplicada", "Entrevistas", "Oferta"].entries()) {
    await main.getByLabel("Etapa", { exact: true }).click();
    await page.getByRole("option", { name: stage }).click();
    await expect(stageChanges(page)).toHaveCount(index + 1);
  }

  // Oldest first, each move from the stage before it.
  const changes = stageChanges(page);
  await expect(changes.nth(0)).toHaveText(/Por revisar.*Aplicada/);
  await expect(changes.nth(1)).toHaveText(/Aplicada.*Entrevistas/);
  await expect(changes.nth(2)).toHaveText(/Entrevistas.*Oferta/);

  // The list shows it under its new stage, and no longer under the first one.
  await main.getByRole("link", { name: "Vacantes" }).click();
  await page.getByRole("link", { name: "Oferta" }).click();
  await expect(page.getByRole("row", { name: /Acme Robotics/ })).toBeVisible();
  await page.getByRole("link", { name: "Por revisar" }).click();
  await expect(page.getByText("No hay vacantes que coincidan.")).toBeVisible();
});

test("sets, changes and clears the next follow-up", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob({ company: "Acme", title: "Engineer" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${id}`);
  const main = page.getByRole("main");
  await expect(main.getByText("Sin seguimiento pendiente.")).toBeVisible();

  // Set it.
  await main.getByRole("link", { name: "Editar" }).click();
  // The detail has a task's own "Fecha" field and stays mounted, hidden: wait for the form, then look in the
  // visible page only.
  await expect(main.getByRole("heading", { name: "Editar vacante" })).toBeVisible();
  await main.getByLabel("Fecha", { exact: true }).fill("2026-12-15");
  await main.getByLabel("Qué hacer", { exact: true }).fill("Preguntar por la segunda entrevista");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(main.getByText("15 dic 2026")).toBeVisible();
  await expect(main.getByText("Preguntar por la segunda entrevista")).toBeVisible();

  // The list shows the same day.
  await page.goto("/es/jobs");
  await expect(page.getByRole("row", { name: /Acme/ })).toContainText("15 dic 2026");

  // Clear it.
  await page.goto(`/es/jobs/${id}/edit`);
  await page.getByLabel("Fecha", { exact: true }).fill("");
  await page.getByLabel("Qué hacer", { exact: true }).fill("");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page).toHaveURL(new RegExp(`/es/jobs/${id}$`));
  await expect(main.getByText("Sin seguimiento pendiente.")).toBeVisible();
  expect(await api.getJob(id)).toMatchObject({ nextFollowUpOn: null, nextFollowUpNote: null });
});

test("shows possible duplicates after saving, and keeps the new job", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    url: "https://jobs.example.com/acme/1",
    status: "applied",
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  await page.goto("/es/jobs/new");
  // Written differently, as on another site: the API still finds the job saved before (decision 031).
  await page.getByLabel("Empresa", { exact: true }).fill("ACME Robotics Inc.");
  await page.getByLabel("Puesto", { exact: true }).fill("Senior Full-Stack Engineer");
  await page.getByRole("button", { name: "Guardar vacante" }).click();

  const notice = page.getByRole("main").getByRole("status");
  await expect(notice).toContainText(
    "Guardaste ACME Robotics Inc. · Senior Full-Stack Engineer, pero se parece a vacantes que ya tienes",
  );
  await expect(notice.getByRole("listitem")).toHaveCount(1);
  await expect(notice.getByRole("listitem")).toContainText("Aplicada");
  await expect(notice.getByRole("link", { name: "ver publicación" })).toHaveAttribute(
    "href",
    "https://jobs.example.com/acme/1",
  );

  // The new job was saved anyway: both are in the list.
  await notice.getByRole("link", { name: "Ir a vacantes" }).click();
  await expect(page.getByRole("row", { name: /Acme Robotics/i })).toHaveCount(2);
});

test("says so when a stage change fails", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createJob({ company: "Acme", title: "Engineer" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/jobs/${id}`);
  const main = page.getByRole("main");
  await expect(main.getByText("Guardada en Por revisar")).toBeVisible();

  // Deleted in another tab while this one stayed open.
  await api.deleteJob(id);
  await main.getByLabel("Etapa", { exact: true }).click();
  await page.getByRole("option", { name: "Aplicada" }).click();
  await expect(main.getByText("Algo salió mal. Intenta de nuevo.")).toBeVisible();
});

test("shows jobs in English", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob({ company: "Acme", title: "Engineer", status: "interviewing", nextFollowUpOn: "2026-12-15" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/en/jobs");

  const row = page.getByRole("row", { name: /Acme/ });
  await expect(row).toContainText("Interviewing");
  await expect(row).toContainText("Dec 15, 2026");
  await row.getByRole("link", { name: "Engineer" }).click();
  await expect(page.getByRole("main").getByText("Saved in Interviewing")).toBeVisible();
});
