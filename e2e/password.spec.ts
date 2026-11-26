import { ADMIN, expect, expireTemporaryPassword, openAccountMenu, signIn, test } from "./fixtures";

const GRACE = { name: "Grace Hopper", email: "grace@example.com" };

test("an account with a temporary password must change it first", async ({ page, api }) => {
  await api.setupAdmin();
  const temporary = await api.createAccount(GRACE.name, GRACE.email);

  await signIn(page, GRACE.email, temporary);
  await expect(page).toHaveURL(/\/es\/password$/);
  await expect(page.getByText("Tu cuenta usa una contraseña temporal. Cámbiala para continuar.")).toBeVisible();

  // Nothing else opens until the password changes.
  await page.goto("/es");
  await expect(page).toHaveURL(/\/es\/password$/);

  await page.getByLabel("Contraseña actual").fill("not it");
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("abc123");
  await page.getByLabel("Confirma la nueva contraseña").fill("abc123");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("La contraseña actual no es correcta.")).toBeVisible();

  await page.getByLabel("Contraseña actual").fill(temporary);
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText(`Hola, ${GRACE.name}.`)).toBeVisible();
});

test("explains an expired temporary password", async ({ page, api }) => {
  await api.setupAdmin();
  const temporary = await api.createAccount(GRACE.name, GRACE.email);
  await expireTemporaryPassword(GRACE.email);

  await signIn(page, GRACE.email, temporary);
  await expect(page.getByText("Tu contraseña temporal venció. Pide al administrador una nueva.")).toBeVisible();
});

test("checks the confirmation and that the new password differs", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await (await openAccountMenu(page)).getByRole("menuitem", { name: "Contraseña" }).click();

  await page.getByLabel("Contraseña actual").fill(ADMIN.password);
  await page.getByLabel("Nueva contraseña", { exact: true }).fill(ADMIN.password);
  await page.getByLabel("Confirma la nueva contraseña").fill("otra");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();

  await expect(page.getByText("La nueva contraseña debe ser distinta de la actual.")).toBeVisible();
  await expect(page.getByText("Las contraseñas no coinciden.")).toBeVisible();
});
