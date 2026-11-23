import { expect, test } from "./fixtures";

test("switches the language and remembers it", async ({ page, api }) => {
  await api.setupAdmin();
  await page.goto("/es/sign-in");
  await page.getByRole("button", { name: "English" }).click();

  await expect(page).toHaveURL(/\/en\/sign-in$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

  // The NEXT_LOCALE cookie brings you back to English.
  await page.goto("/");
  await expect(page).toHaveURL(/\/en\/sign-in$/);
});

test("switches between light and dark and remembers it", async ({ page, api }) => {
  await api.setupAdmin();
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/es/sign-in");
  const html = page.locator("html");
  const darkTheme = page.getByRole("switch", { name: "Tema oscuro" });

  // Follows the system first.
  await expect(darkTheme).not.toBeChecked();
  await expect(html).not.toHaveClass(/\bdark\b/);

  await darkTheme.click();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(darkTheme).toBeChecked();
});
