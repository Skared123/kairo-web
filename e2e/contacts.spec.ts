import { ADMIN, expect, signIn, test } from "./fixtures";

test("adds a contact with every field, from an empty list", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.getByRole("link", { name: "Contactos" }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Contactos", level: 1 })).toBeVisible();
  await expect(main.getByText("Aún no tienes contactos.")).toBeVisible();
  await main.getByRole("link", { name: "Nuevo contacto" }).click();
  await expect(main.getByRole("heading", { name: "Nuevo contacto" })).toBeVisible();

  // A name is all it needs; what is filled in must be valid.
  await main.getByRole("button", { name: "Guardar contacto" }).click();
  await expect(main.getByText("Este campo es obligatorio.")).toBeVisible();
  await main.getByLabel("Correo", { exact: true }).fill("margaret");
  await main.getByLabel("Perfil de LinkedIn", { exact: true }).fill("linkedin.com/in/example");
  await main.getByRole("button", { name: "Guardar contacto" }).click();
  await expect(main.getByText("Escribe un correo electrónico válido.")).toBeVisible();
  await expect(main.getByText("Escribe un enlace que empiece con http:// o https://.")).toBeVisible();

  await main.getByLabel("Nombre", { exact: true }).fill("Margaret Hamilton");
  await main.getByLabel("Empresa", { exact: true }).fill("Acme Robotics");
  await main.getByLabel("Puesto", { exact: true }).fill("Talent Partner");
  await main.getByLabel("Tipo", { exact: true }).click();
  await page.getByRole("option", { name: "Reclutador(a)" }).click();
  await main.getByLabel("Correo", { exact: true }).fill("margaret@example.com");
  await main.getByLabel("Teléfono", { exact: true }).fill("+52 55 1234 5678");
  await main.getByLabel("Perfil de LinkedIn", { exact: true }).fill("https://www.linkedin.com/in/example");
  await main.getByLabel("Notas", { exact: true }).fill("Nos conocimos en un meetup");
  await main.getByLabel("Fecha", { exact: true }).fill("2026-12-01");
  await main.getByLabel("Qué escribirle", { exact: true }).fill("Mandarle el portafolio");
  await main.getByRole("button", { name: "Guardar contacto" }).click();

  // Saving opens the contact's page; the list shows it too.
  await expect(page).toHaveURL(/\/es\/contacts\/[\w-]+$/);
  await expect(main.getByRole("heading", { name: "Margaret Hamilton", level: 1 })).toBeVisible();
  await main.getByRole("link", { name: "← Contactos" }).click();
  const row = page.getByRole("row", { name: /Margaret Hamilton/ });
  await expect(row).toContainText("Talent Partner");
  await expect(row).toContainText("Acme Robotics");
  await expect(row).toContainText("Reclutador(a)");
  await expect(row).toContainText("1 dic 2026");
});

test("edits a contact and clears a field", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createContact({
    name: "Margaret Hamilton",
    company: "Acme Robotics",
    email: "margaret@example.com",
  });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/contacts");
  await page.getByRole("link", { name: "Margaret Hamilton" }).click();

  const main = page.getByRole("main");
  await main.getByRole("link", { name: "Editar" }).click();
  await expect(main.getByRole("heading", { name: "Editar contacto" })).toBeVisible();
  await expect(main.getByLabel("Empresa", { exact: true })).toHaveValue("Acme Robotics");
  await main.getByLabel("Empresa", { exact: true }).fill("Globex");
  await main.getByLabel("Correo", { exact: true }).fill("");
  await main.getByRole("button", { name: "Guardar cambios" }).click();

  // Back on the contact's page.
  await expect(page).toHaveURL(new RegExp(`/es/contacts/${id}$`));
  await expect(main.getByText("Globex")).toBeVisible();
  await expect(main.getByText("Sin correo, teléfono ni LinkedIn.")).toBeVisible();
  expect(await api.getContact(id)).toMatchObject({ company: "Globex", email: null });
});

test("searches by name or company, and shows the latest conversation", async ({ page, api }) => {
  await api.setupAdmin();
  const margaret = await api.createContact({ name: "Margaret Hamilton", company: "Acme Robotics" });
  await api.createContact({ name: "Barbara Liskov", company: "Globex" });
  await api.logInteraction(margaret, { occurredOn: "2026-11-20", channel: "call" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/contacts");

  const rows = page.getByRole("main").getByRole("row");
  // A header row, then one per contact, by name.
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toContainText("Barbara Liskov");
  await expect(rows.nth(2)).toContainText("Margaret Hamilton");
  await expect(rows.nth(2)).toContainText("20 nov 2026");

  const search = page.getByRole("searchbox", { name: "Buscar por nombre o empresa" });
  await search.fill("acme");
  await search.press("Enter");
  await expect(page).toHaveURL(/q=acme/);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("Margaret Hamilton");

  await search.fill("Initech");
  await search.press("Enter");
  await expect(page.getByText("No hay contactos que coincidan.")).toBeVisible();
});

test("shows contacts in English", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createContact({ name: "Margaret Hamilton", kind: "hiring_manager" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/en/contacts");

  await expect(page.getByRole("heading", { name: "Contacts", level: 1 })).toBeVisible();
  await expect(page.getByRole("row", { name: /Margaret Hamilton/ })).toContainText("Hiring manager");
});

test("never shows or opens another user's contacts", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createContact({ name: "Margaret Hamilton" });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto("/es/contacts");
  await expect(page.getByText("Aún no tienes contactos.")).toBeVisible();

  await page.goto(`/es/contacts/${id}`);
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByText("Margaret Hamilton")).toHaveCount(0);

  await page.goto(`/es/contacts/${id}/edit`);
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveCount(0);
});
