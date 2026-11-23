import { ADMIN, expect, signIn, test } from "./fixtures";

const REMOTE_CONTRACT = {
  company: "Acme",
  title: "Senior Engineer",
  workMode: "remote",
  contractType: "contractor",
  salaryMax: 6000,
  salaryCurrency: "USD",
  salaryPeriod: "month",
};

test("saves the criteria, and every job shows how it compares", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob(REMOTE_CONTRACT);
  await api.createJob({ company: "Globex", title: "Engineer", workMode: "onsite", contractType: "employee" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/jobs");

  // No criteria yet: nothing to compare.
  await expect(page.getByRole("row", { name: /Acme/ })).toContainText("—");

  await page.getByRole("link", { name: "Criterios" }).click();
  await expect(page.getByRole("heading", { name: "Tus criterios" })).toBeVisible();
  await page.getByLabel("Salario mínimo", { exact: true }).fill("5000");
  await page.getByLabel("Moneda", { exact: true }).fill("usd");
  await page.getByLabel("Periodo", { exact: true }).click();
  await page.getByRole("option", { name: "Al mes" }).click();
  await page.getByLabel("Solo trabajos 100% remotos").check();
  await page.getByLabel("Contratista").check();
  await page.getByRole("button", { name: "Guardar criterios" }).click();
  await expect(page.getByRole("status")).toContainText("Criterios guardados");

  await page.getByRole("link", { name: "Vacantes" }).first().click();
  const acme = page.getByRole("row", { name: /Acme/ });
  await expect(acme).toContainText("Salario: cumple");
  await expect(acme).toContainText("Remoto: cumple");
  await expect(acme).toContainText("Contrato: cumple");
  const globex = page.getByRole("row", { name: /Globex/ });
  await expect(globex).toContainText("Salario: no lo dice");
  await expect(globex).toContainText("Remoto: no cumple");
  await expect(globex).toContainText("Contrato: no cumple");
});

test("keeps the saved criteria and lets you clear the salary target", async ({ page, api }) => {
  await api.setupAdmin();
  await api.saveCriteria({ minSalary: 5000, currency: "USD", period: "month", remoteOnly: true, contractTypes: [] });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/criteria");

  await expect(page.getByLabel("Salario mínimo", { exact: true })).toHaveValue("5000");
  await expect(page.getByLabel("Moneda", { exact: true })).toHaveValue("USD");
  await expect(page.getByLabel("Solo trabajos 100% remotos")).toBeChecked();

  // A partial target is refused before calling the API.
  await page.getByLabel("Moneda", { exact: true }).fill("");
  await page.getByRole("button", { name: "Guardar criterios" }).click();
  await expect(
    page.getByText("Indica el salario mínimo, la moneda y el periodo juntos, o deja los tres vacíos."),
  ).toBeVisible();

  await page.getByLabel("Salario mínimo", { exact: true }).fill("");
  await page.getByLabel("Periodo", { exact: true }).click();
  await page.getByRole("option", { name: "—" }).click();
  await page.getByRole("button", { name: "Guardar criterios" }).click();
  await expect(page.getByRole("status")).toContainText("Criterios guardados");
});

test("keeps each user's criteria their own", async ({ page, api }) => {
  await api.setupAdmin();
  await api.saveCriteria({ minSalary: 5000, currency: "USD", period: "month", remoteOnly: true, contractTypes: [] });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto("/es/criteria");
  await expect(page.getByLabel("Salario mínimo", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Solo trabajos 100% remotos")).not.toBeChecked();
});
