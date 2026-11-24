import { ADMIN, expect, signIn, test } from "./fixtures";

test("first run: setup creates the admin and signs them in", async ({ page, api }) => {
  void api; // starts from an empty database
  await page.goto("/");
  // No admin yet: the sign-in screen sends you to the first-run screen.
  await expect(page).toHaveURL(/\/es\/setup$/);

  await page.getByLabel("Nombre").fill(ADMIN.name);
  await page.getByLabel("Correo electrónico").fill(ADMIN.email);
  await page.getByLabel("Contraseña").fill(ADMIN.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText(`Hola, ${ADMIN.name}.`)).toBeVisible();
  // Setup happens once: afterwards it sends you on.
  await page.goto("/es/setup");
  await expect(page).toHaveURL(/\/es$/);
});

test("validates the setup form before calling the API", async ({ page, api }) => {
  void api;
  await page.goto("/es/setup");
  await page.getByLabel("Correo electrónico").fill("no-es-un-correo");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Este campo es obligatorio.")).toHaveCount(2);
  await expect(page.getByText("Escribe un correo electrónico válido.")).toBeVisible();
});

test("signs in, refuses a wrong password, and signs out", async ({ page, api }) => {
  await api.setupAdmin();

  await signIn(page, ADMIN.email, "not the password");
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();

  await page.getByLabel("Contraseña").fill(ADMIN.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(`Hola, ${ADMIN.name}.`)).toBeVisible();

  // Signed in, the sign-in screen sends you home.
  await page.goto("/es/sign-in");
  await expect(page).toHaveURL(/\/es$/);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/es\/sign-in$/);
  await page.goto("/es");
  await expect(page).toHaveURL(/\/es\/sign-in$/);
});

test("sends guests to sign-in", async ({ page, api }) => {
  await api.setupAdmin();
  for (const path of ["/es", "/es/password", "/es/admin/users"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/es\/sign-in$/);
  }
});
