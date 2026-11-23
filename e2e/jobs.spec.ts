import { ADMIN, expect, signIn, test } from "./fixtures";

test("shows an empty list before the first job", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.getByRole("link", { name: "Vacantes" }).click();

  await expect(page.getByRole("heading", { name: "Vacantes" })).toBeVisible();
  await expect(page.getByText("Aún no tienes vacantes.")).toBeVisible();
});

test("filters by stage, searches, sorts by follow-up and shows the criteria match", async ({ page, api }) => {
  await api.setupAdmin();
  await api.saveCriteria({ minSalary: 5000, currency: "USD", period: "month", remoteOnly: true, contractTypes: [] });
  await api.createJob({ company: "Acme", title: "Backend Engineer", nextFollowUpOn: "2026-12-20" });
  await api.createJob({ company: "Globex", title: "Fullstack Developer", status: "applied" });
  await api.createJob({
    company: "Initech",
    title: "Senior Engineer",
    workMode: "remote",
    salaryMax: 6000,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    nextFollowUpOn: "2026-12-02",
  });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/jobs");

  const rows = page.getByRole("row").filter({ hasNot: page.getByRole("columnheader") });
  await expect(rows).toHaveCount(3);
  await expect(page.getByRole("row", { name: /Initech/ })).toContainText("Salario: cumple");
  await expect(page.getByRole("row", { name: /Initech/ })).toContainText("Remoto: cumple");
  await expect(page.getByRole("row", { name: /Acme/ })).toContainText("Salario: no lo dice");

  // A stage tab.
  await page.getByRole("link", { name: "Aplicada" }).click();
  await expect(page).toHaveURL(/status=applied/);
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText("Globex");

  // Back to all, then search: the stage tab and the search combine.
  await page.getByRole("link", { name: "Todas" }).click();
  await page.getByRole("searchbox").fill("engineer");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/q=engineer/);
  await expect(rows).toHaveCount(2);

  // Soonest follow-up first, jobs without one last.
  await page.getByRole("link", { name: "Próximo seguimiento" }).click();
  await expect(page).toHaveURL(/sort=followUp/);
  await expect(rows.nth(0)).toContainText("Initech");
  await expect(rows.nth(1)).toContainText("Acme");

  await page.getByRole("searchbox").fill("nada parecido");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("No hay vacantes que coincidan.")).toBeVisible();
});

test("never shows another user's jobs", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob({ company: "Acme", title: "Backend Engineer" });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto("/es/jobs");
  await expect(page.getByText("Aún no tienes vacantes.")).toBeVisible();
  await expect(page.getByText("Acme")).toHaveCount(0);
});
