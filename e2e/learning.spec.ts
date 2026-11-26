import { ADMIN, expect, signIn, test } from "./fixtures";

test("adds a learning item with new skills, from an empty list", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.getByRole("link", { name: "Aprendizaje" }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Aprendizaje", level: 1 })).toBeVisible();
  await expect(main.getByText("Aún no tienes recursos de aprendizaje.")).toBeVisible();
  await main.getByRole("link", { name: "Nuevo recurso" }).click();

  // A title and a kind are all it needs.
  await main.getByRole("button", { name: "Guardar recurso" }).click();
  await expect(main.getByText("Este campo es obligatorio.")).toHaveCount(2);

  await main.getByLabel("Título", { exact: true }).fill("NestJS Fundamentals");
  await main.getByLabel("Tipo", { exact: true }).click();
  await page.getByRole("option", { name: "Curso" }).click();
  await main.getByLabel("Enlace", { exact: true }).fill("https://example.com/nestjs");

  // Enter and a comma add a skill; the form is not sent.
  const skills = main.getByLabel("Habilidades que entrena", { exact: true });
  await skills.fill("NestJS");
  await skills.press("Enter");
  await skills.fill("TypeScript");
  await skills.press(",");
  // A repeated one, written differently, is not added twice.
  await skills.fill(" typescript ");
  await skills.press("Enter");
  const chosen = main.getByRole("list", { name: "Habilidades elegidas" });
  await expect(chosen.getByRole("listitem")).toHaveText(["NestJS", "TypeScript"]);
  await expect(page).toHaveURL(/\/learning\/new$/);

  await main.getByLabel("Estado", { exact: true }).click();
  await page.getByRole("option", { name: "En curso" }).click();
  await main.getByRole("button", { name: "Guardar recurso" }).click();

  await expect(page).toHaveURL(/\/es\/learning$/);
  const row = page.getByRole("row", { name: /NestJS Fundamentals/ });
  await expect(row).toContainText("Curso");
  await expect(row).toContainText("NestJS");
  await expect(row).toContainText("TypeScript");
  await expect(row).toContainText("En curso");
  await expect(row.getByRole("link", { name: "Abrir NestJS Fundamentals" })).toHaveAttribute(
    "href",
    "https://example.com/nestjs",
  );
});

test("reuses the user's skills, removes them, and keeps what was typed when leaving the field", async ({
  page,
  api,
}) => {
  await api.setupAdmin();
  await api.createLearningItem({ title: "Effective TypeScript", kind: "book", skills: ["TypeScript"] });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning/new");

  const main = page.getByRole("main");
  await main.getByLabel("Título", { exact: true }).fill("Total TypeScript");
  await main.getByLabel("Tipo", { exact: true }).click();
  await page.getByRole("option", { name: "Video" }).click();

  const skills = main.getByLabel("Habilidades que entrena", { exact: true });
  const chosen = main.getByRole("list", { name: "Habilidades elegidas" });
  // Written in lowercase, it takes the existing skill's spelling.
  await skills.fill("typescript");
  await skills.press("Enter");
  await skills.fill("Zod");
  await skills.press("Enter");
  await expect(chosen.getByRole("listitem")).toHaveText(["TypeScript", "Zod"]);

  // Backspace in the empty field removes the last one; the ✕ removes any.
  await skills.press("Backspace");
  await expect(chosen.getByRole("listitem")).toHaveText(["TypeScript"]);
  await chosen.getByRole("button", { name: "Quitar TypeScript" }).click();
  await expect(chosen).toHaveCount(0);

  // Typed but not added with Enter: leaving the field adds it.
  await skills.fill("Generics");
  await main.getByLabel("Notas", { exact: true }).click();
  await expect(main.getByRole("list", { name: "Habilidades elegidas" }).getByRole("listitem")).toHaveText([
    "Generics",
  ]);
  await main.getByRole("button", { name: "Guardar recurso" }).click();

  await expect(page).toHaveURL(/\/es\/learning$/);
  expect((await api.listSkills()).map((skill) => skill.name)).toEqual(["Generics", "TypeScript"]);
});

test("edits an item: status, skills and a cleared link", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createLearningItem({
    title: "NestJS Fundamentals",
    url: "https://example.com/nestjs",
    skills: ["NestJS", "TypeScript"],
  });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning");
  await page.getByRole("link", { name: "NestJS Fundamentals", exact: true }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Editar recurso" })).toBeVisible();
  const chosen = main.getByRole("list", { name: "Habilidades elegidas" });
  await expect(chosen.getByRole("listitem")).toHaveText(["NestJS", "TypeScript"]);
  await chosen.getByRole("button", { name: "Quitar NestJS" }).click();
  await main.getByLabel("Habilidades que entrena", { exact: true }).fill("PostgreSQL");
  await main.getByLabel("Habilidades que entrena", { exact: true }).press("Enter");
  await main.getByLabel("Enlace", { exact: true }).fill("");
  await main.getByLabel("Estado", { exact: true }).click();
  await page.getByRole("option", { name: "Terminado" }).click();
  await main.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page).toHaveURL(/\/es\/learning$/);
  await expect(page.getByRole("row", { name: /NestJS Fundamentals/ })).toContainText("Terminado");
  expect(await api.getLearningItem(id)).toMatchObject({
    status: "done",
    url: null,
    finishedAt: expect.any(String),
    skills: [{ name: "PostgreSQL" }, { name: "TypeScript" }],
  });
});

test("filters by status and by skill", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createLearningItem({ title: "NestJS Fundamentals", status: "in_progress", skills: ["NestJS"] });
  await api.createLearningItem({ title: "Effective TypeScript", kind: "book", skills: ["TypeScript"] });
  await api.createLearningItem({ title: "Docker basics", kind: "video", status: "done", skills: ["Docker"] });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning");

  const rows = page.getByRole("main").getByRole("row");
  // In progress first, then to start, then done.
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(1)).toContainText("NestJS Fundamentals");
  await expect(rows.nth(2)).toContainText("Effective TypeScript");
  await expect(rows.nth(3)).toContainText("Docker basics");

  await page.getByRole("link", { name: "Terminado", exact: true }).click();
  await expect(page).toHaveURL(/status=done/);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("Docker basics");

  await page.getByRole("link", { name: "Todos", exact: true }).click();
  await page.getByLabel("Habilidad", { exact: true }).click();
  await page.getByRole("option", { name: "TypeScript (1)" }).click();
  await expect(page).toHaveURL(/skillId=/);
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1)).toContainText("Effective TypeScript");

  // Both filters together, matching nothing.
  await page.getByRole("link", { name: "En curso", exact: true }).click();
  await expect(page.getByText("No hay recursos que coincidan.")).toBeVisible();
});

test("deletes an item after a confirmation, keeping its skills", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createLearningItem({ title: "NestJS Fundamentals", skills: ["NestJS"] });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/learning/${id}/edit`);

  await page.getByRole("button", { name: "Borrar" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("¿Borrar «NestJS Fundamentals»?");
  await confirm.getByRole("button", { name: "Borrar" }).click();

  await expect(page).toHaveURL(/\/es\/learning$/);
  await expect(page.getByText("Aún no tienes recursos de aprendizaje.")).toBeVisible();
  expect(await api.listSkills()).toMatchObject([{ name: "NestJS", itemCount: 0 }]);
});

test("shows learning in English", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createLearningItem({ title: "Designing Data-Intensive Applications", kind: "book", status: "in_progress" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/en/learning");

  await expect(page.getByRole("heading", { name: "Learning", level: 1 })).toBeVisible();
  const row = page.getByRole("row", { name: /Designing Data-Intensive Applications/ });
  await expect(row).toContainText("Book");
  await expect(row).toContainText("In progress");

  await page.goto("/en/skills");
  await expect(page.getByRole("heading", { name: "Skills", level: 1 })).toBeVisible();
  await expect(page.getByText("No skills yet. Add them to your learning items.")).toBeVisible();
});

test("never shows or opens another user's learning items", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createLearningItem({ title: "NestJS Fundamentals", skills: ["NestJS"] });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await page.goto("/es/learning");
  await expect(page.getByText("Aún no tienes recursos de aprendizaje.")).toBeVisible();
  // Ada's skill is not offered as a filter either.
  await expect(page.getByLabel("Habilidad", { exact: true })).toHaveCount(0);

  await page.goto(`/es/learning/${id}/edit`);
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toHaveCount(0);

  // Nor Ada's skills.
  await page.goto("/es/skills");
  await expect(page.getByText("Aún no tienes habilidades. Agrégalas a tus recursos de aprendizaje.")).toBeVisible();
  await expect(page.getByText("NestJS")).toHaveCount(0);
});

test("changes an item's status from the list", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createLearningItem({ title: "NestJS Fundamentals", status: "in_progress", isFocus: true });
  await api.createLearningItem({ title: "Effective TypeScript", kind: "book" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning");

  await page.getByLabel("Estado de NestJS Fundamentals").click();
  await page.getByRole("option", { name: "Terminado" }).click();

  // Done: it sorts last, and a finished item has no star.
  const rows = page.getByRole("main").getByRole("row");
  await expect(rows.nth(2)).toContainText("NestJS Fundamentals");
  await expect(page.getByRole("button", { name: "Foco: NestJS Fundamentals" })).toHaveCount(0);
  expect(await api.getLearningItem(id)).toMatchObject({
    status: "done",
    isFocus: false,
    finishedAt: expect.any(String),
  });
});

test("moves the focus with the star, one item at a time", async ({ page, api }) => {
  await api.setupAdmin();
  const nest = await api.createLearningItem({ title: "NestJS Fundamentals", status: "in_progress" });
  const book = await api.createLearningItem({ title: "Effective TypeScript", kind: "book" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning");

  const nestStar = page.getByRole("button", { name: "Foco: NestJS Fundamentals" });
  const bookStar = page.getByRole("button", { name: "Foco: Effective TypeScript" });
  await expect(nestStar).toHaveAttribute("aria-pressed", "false");

  await nestStar.click();
  await expect(nestStar).toHaveAttribute("aria-pressed", "true");
  // The star shows at once and is disabled until its save and refresh are done.
  await expect(nestStar).toBeEnabled();

  // Marking another moves it, and the focus sorts first.
  await bookStar.click();
  await expect(bookStar).toHaveAttribute("aria-pressed", "true");
  await expect(nestStar).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("main").getByRole("row").nth(1)).toContainText("Effective TypeScript");
  expect(await api.getLearningItem(book)).toMatchObject({ isFocus: true });
  expect(await api.getLearningItem(nest)).toMatchObject({ isFocus: false });

  await bookStar.click();
  await expect(bookStar).toHaveAttribute("aria-pressed", "false");
  await expect.poll(async () => (await api.getLearningItem(book)).isFocus).toBe(false);
});

test("renames and deletes skills, and leads to their items", async ({ page, api }) => {
  await api.setupAdmin();
  const item = await api.createLearningItem({ title: "NestJS Fundamentals", skills: ["NestJS", "typescript"] });
  await api.createLearningItem({ title: "Effective TypeScript", kind: "book", skills: ["TypeScript"] });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning");
  await page.getByRole("link", { name: "Habilidades" }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Habilidades", level: 1 })).toBeVisible();
  await expect(main.getByRole("row", { name: /typescript/ })).toContainText("2 recursos");
  await expect(main.getByRole("row", { name: /NestJS/ })).toContainText("1 recurso");

  // A name it already has is refused.
  await main.getByRole("button", { name: "Renombrar NestJS" }).click();
  const dialog = page.getByRole("dialog", { name: "Renombrar habilidad" });
  await dialog.getByLabel("Nombre", { exact: true }).fill("TYPESCRIPT");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByText("Ya tienes una habilidad con ese nombre.")).toBeVisible();
  await dialog.getByLabel("Nombre", { exact: true }).fill("NestJS 11");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog).toBeHidden();
  await expect(main.getByRole("row", { name: /NestJS 11/ })).toBeVisible();
  expect((await api.getLearningItem(item)).skills).toMatchObject([{ name: "NestJS 11" }, { name: "typescript" }]);

  // Deleting says how many items keep going without it.
  await main.getByRole("button", { name: "Borrar NestJS 11" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("1 recurso la usa; se queda, sin ella.");
  await confirm.getByRole("button", { name: "Borrar" }).click();
  await expect(main.getByRole("row", { name: /NestJS 11/ })).toHaveCount(0);
  expect((await api.getLearningItem(item)).skills).toMatchObject([{ name: "typescript" }]);

  // A skill's count leads to its items.
  await main.getByRole("link", { name: "2 recursos" }).click();
  await expect(page).toHaveURL(/\/es\/learning\?skillId=/);
  await expect(page.getByRole("main").getByRole("row")).toHaveCount(3);
});

test("says so when saving an item that was deleted in another tab", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createLearningItem({ title: "NestJS Fundamentals" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto(`/es/learning/${id}/edit`);
  const main = page.getByRole("main");
  await expect(main.getByLabel("Título", { exact: true })).toHaveValue("NestJS Fundamentals");

  await api.deleteLearningItem(id);
  await main.getByLabel("Notas", { exact: true }).fill("Voy en el módulo de pruebas");
  await main.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(main.getByText("Ese recurso ya no existe.")).toBeVisible();
});

test("says so when a status change fails, and goes back to the saved one", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createLearningItem({ title: "NestJS Fundamentals", status: "in_progress" });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/es/learning");

  // The API is down for this request only.
  await page.route("**/api/learning/*", (route) =>
    route.request().method() === "PATCH" ? route.fulfill({ status: 500 }) : route.fallback(),
  );
  const select = page.getByLabel("Estado de NestJS Fundamentals");
  await select.click();
  await page.getByRole("option", { name: "Terminado" }).click();

  await expect(page.getByRole("main").getByText("Algo salió mal. Intenta de nuevo.")).toBeVisible();
  await expect(select).toHaveText("En curso");
  expect(await api.getLearningItem(id)).toMatchObject({ status: "in_progress" });
});
