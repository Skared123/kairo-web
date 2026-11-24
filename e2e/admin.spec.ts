import { ADMIN, expect, signIn, test } from "./fixtures";

test("creates an account and shows its temporary password once", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.getByRole("link", { name: "Administración" }).click();
  await expect(page.getByRole("heading", { name: "Cuentas" })).toBeVisible();

  await page.getByRole("button", { name: "Nueva cuenta" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre").fill("Grace Hopper");
  await dialog.getByLabel("Correo electrónico").fill("grace@example.com");
  await dialog.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(dialog.getByRole("heading", { name: "Contraseña temporal" })).toBeVisible();
  await expect(dialog.locator("code")).toHaveText(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
  await dialog.getByRole("button", { name: "Listo" }).click();

  const row = page.getByRole("row", { name: /Grace Hopper/ });
  await expect(row).toContainText("Temporal, vence");
});

test("refuses an email that already has an account", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createAccount("Grace Hopper", "grace@example.com");
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/admin/users");

  await page.getByRole("button", { name: "Nueva cuenta" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre").fill("Otra Grace");
  await dialog.getByLabel("Correo electrónico").fill("GRACE@example.com");
  await dialog.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(dialog.getByText("Ya existe una cuenta con ese correo.")).toBeVisible();
});

test("never removes the last admin, and deactivates other accounts", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createAccount("Grace Hopper", "grace@example.com");
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/admin/users");

  await page.getByRole("button", { name: `Acciones para ${ADMIN.name}` }).click();
  await page.getByRole("menuitem", { name: "Quitar admin" }).click();
  const confirm = page.getByRole("alertdialog");
  await confirm.getByRole("button", { name: "Confirmar" }).click();
  await expect(confirm.getByText("Debe haber al menos un admin activo.")).toBeVisible();
  await confirm.getByRole("button", { name: "Cancelar" }).click();

  await page.getByRole("button", { name: "Acciones para Grace Hopper" }).click();
  await page.getByRole("menuitem", { name: "Desactivar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("row", { name: /Grace Hopper/ })).toContainText("Desactivada");
});

test("keeps the admin screen from other users", async ({ page, api }) => {
  await api.setupAdmin();
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await expect(page.getByText("Hola, Grace Hopper.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Administración" })).toHaveCount(0);

  await page.goto("/es/admin/users");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { name: "Cuentas" })).toHaveCount(0);
});
