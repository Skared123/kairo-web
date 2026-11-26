import { ADMIN, expect, openAccountMenu, signIn, test } from "./fixtures";

test("marks the section of the current page", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);

  const nav = page.getByRole("banner").getByRole("navigation", { name: "Secciones" });
  const current = nav.locator('[aria-current="page"]');
  await expect(current).toHaveText("Hoy");

  await nav.getByRole("link", { name: "Aprendizaje" }).click();
  await expect(page.getByRole("main").getByRole("heading", { name: "Aprendizaje", level: 1 })).toBeVisible();
  await expect(current).toHaveText("Aprendizaje");

  // Pages under a section mark it too; the password page is in none.
  await page.goto("/es/skills");
  await expect(current).toHaveText("Aprendizaje");
  await page.goto("/es/criteria");
  await expect(current).toHaveText("Vacantes");
  await page.goto("/es/password");
  await expect(page.getByRole("main").getByLabel("Contraseña actual")).toBeVisible();
  await expect(current).toHaveCount(0);
});

test("changes the language and the theme from the account menu", async ({ page, api }) => {
  await api.setupAdmin();
  await page.emulateMedia({ colorScheme: "light" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/jobs");

  const menu = await openAccountMenu(page);
  await expect(menu).toContainText(ADMIN.email);
  await expect(menu.getByRole("menuitemradio", { name: "Español" })).toBeChecked();

  // The theme changes with the menu still open, and is remembered.
  const html = page.locator("html");
  const darkTheme = menu.getByRole("menuitemcheckbox", { name: "Tema oscuro" });
  await expect(darkTheme).not.toBeChecked();
  await darkTheme.click();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(darkTheme).toBeChecked();

  // The language keeps the page.
  await menu.getByRole("menuitemradio", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/jobs$/);
  await expect(page.getByRole("banner").getByRole("link", { name: "Jobs" })).toHaveAttribute("aria-current", "page");

  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  const english = await openAccountMenu(page);
  await expect(english.getByRole("menuitemcheckbox", { name: "Dark theme" })).toBeChecked();
  await expect(english.getByRole("menuitemradio", { name: "English" })).toBeChecked();
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("fits the screen, with the sections as icons that keep their names", async ({ page, api }) => {
    await api.setupAdmin();
    await signIn(page, ADMIN.email, ADMIN.password);
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Hoy" })).toBeVisible();

    // Nothing sticks out sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    // Each section is an icon-sized button.
    expect((await header.getByRole("link", { name: "Contactos" }).boundingBox())!.width).toBeLessThan(40);

    await header.getByRole("link", { name: "Contactos" }).click();
    await expect(page.getByRole("main").getByRole("heading", { name: "Contactos", level: 1 })).toBeVisible();
    const menu = await openAccountMenu(page);
    await expect(menu).toContainText(ADMIN.name);
    await expect(menu.getByRole("menuitem", { name: "Cerrar sesión" })).toBeVisible();
  });
});
