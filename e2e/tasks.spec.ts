import { ADMIN, day, expect, signIn, test } from "./fixtures";

const section = (page: import("@playwright/test").Page, name: RegExp) => page.getByRole("region", { name });

test("adds tasks from the quick add, with or without a day and a job", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  await signIn(page, ADMIN.email, ADMIN.password);

  // A title is all it needs.
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByText("Este campo es obligatorio.")).toBeVisible();

  const title = page.getByLabel("Tarea", { exact: true });
  await title.fill("Preparar la entrevista técnica");
  await page.getByLabel("Fecha", { exact: true }).fill(day(0));
  await page.getByLabel("Vacante", { exact: true }).click();
  await page.getByRole("option", { name: "Acme Robotics · Senior Fullstack Engineer" }).click();
  await page.getByRole("button", { name: "Agregar" }).click();

  const today = section(page, /^Hoy · 1$/);
  await expect(today).toContainText("Preparar la entrevista técnica");
  await expect(today.getByRole("link", { name: "Acme Robotics · Senior Fullstack Engineer" })).toBeVisible();

  // Ready for the next one: cleared, and still focused.
  await expect(title).toHaveValue("");
  await expect(title).toBeFocused();
  await title.fill("Escribir un post en LinkedIn");
  await title.press("Enter");
  await expect(section(page, /^Sin fecha · 1$/)).toContainText("Escribir un post en LinkedIn");
});

test("marks a task done and opens it again", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createTask({ title: "Mandar el CV actualizado", dueOn: day(0) });
  await signIn(page, ADMIN.email, ADMIN.password);

  await page.getByRole("checkbox", { name: "Marcar como hecha: Mandar el CV actualizado" }).click();
  const done = section(page, /^Terminadas hoy · 1$/);
  await expect(done).toBeVisible();
  await expect(page.getByText("No tienes pendientes")).toBeVisible();
  expect((await api.getTask(id)).doneAt).toEqual(expect.any(String));

  // Undone from "Done today", it goes back to its section.
  await done.getByText("Terminadas hoy · 1").click();
  await done.getByRole("checkbox", { name: "Marcar como pendiente: Mandar el CV actualizado" }).click();
  await expect(section(page, /^Hoy · 1$/)).toContainText("Mandar el CV actualizado");
  expect((await api.getTask(id)).doneAt).toBeNull();
});

test("undoes the check and says so when saving fails", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createTask({ title: "Mandar el CV actualizado", dueOn: day(0) });
  await signIn(page, ADMIN.email, ADMIN.password);

  // The API is down for this request only.
  await page.route("**/api/tasks/*", (route) =>
    route.request().method() === "PATCH" ? route.fulfill({ status: 500 }) : route.fallback(),
  );
  const checkbox = page.getByRole("checkbox", { name: "Marcar como hecha: Mandar el CV actualizado" });
  await checkbox.click();

  await expect(page.getByText("Algo salió mal. Intenta de nuevo.")).toBeVisible();
  await expect(checkbox).not.toBeChecked();
  await expect(section(page, /^Hoy · 1$/)).toContainText("Mandar el CV actualizado");
  expect((await api.getTask(id)).doneAt).toBeNull();
});

test("takes away a task deleted in another tab when it is checked", async ({ page, api }) => {
  await api.setupAdmin();
  const id = await api.createTask({ title: "Mandar el CV actualizado", dueOn: day(0) });
  await signIn(page, ADMIN.email, ADMIN.password);
  await expect(section(page, /^Hoy · 1$/)).toBeVisible();

  await api.deleteTask(id);
  await page.getByRole("checkbox", { name: "Marcar como hecha: Mandar el CV actualizado" }).click();

  await expect(page.getByText("No tienes pendientes")).toBeVisible();
  await expect(page.getByText("Algo salió mal. Intenta de nuevo.")).toHaveCount(0);
});

test("edits a task in a dialog", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({ company: "Acme Robotics", title: "Senior Fullstack Engineer" });
  const id = await api.createTask({ title: "Preparar", dueOn: day(0), jobId: job });
  await signIn(page, ADMIN.email, ADMIN.password);

  await page.getByRole("button", { name: "Editar Preparar" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Tarea", { exact: true })).toHaveValue("Preparar");
  await dialog.getByLabel("Tarea", { exact: true }).fill("Preparar la entrevista técnica");
  await dialog.getByLabel("Fecha", { exact: true }).fill(day(3));
  await dialog.getByLabel("Vacante", { exact: true }).click();
  await page.getByRole("option", { name: "Sin vacante" }).click();
  await dialog.getByLabel("Notas", { exact: true }).fill("Repasar system design");
  await dialog.getByRole("button", { name: "Guardar" }).click();

  await expect(dialog).toBeHidden();
  const upcoming = section(page, /^Próximos 7 días · 1$/);
  await expect(upcoming).toContainText("Preparar la entrevista técnica");
  await expect(upcoming).toContainText("Repasar system design");
  expect(await api.getTask(id)).toMatchObject({ title: "Preparar la entrevista técnica", dueOn: day(3), job: null });

  // The title is required here too.
  await page.getByRole("button", { name: "Editar Preparar la entrevista técnica" }).click();
  await dialog.getByLabel("Tarea", { exact: true }).fill("");
  await dialog.getByRole("button", { name: "Guardar" }).click();
  await expect(dialog.getByText("Este campo es obligatorio.")).toBeVisible();
});

test("deletes a task after a confirmation", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createTask({ title: "Renovar el portafolio" });
  await signIn(page, ADMIN.email, ADMIN.password);

  // Cancelling keeps it.
  await page.getByRole("button", { name: "Borrar Renovar el portafolio" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("¿Borrar la tarea «Renovar el portafolio»?");
  await confirm.getByRole("button", { name: "Cancelar" }).click();
  await expect(section(page, /^Sin fecha · 1$/)).toBeVisible();

  await page.getByRole("button", { name: "Borrar Renovar el portafolio" }).click();
  await confirm.getByRole("button", { name: "Borrar" }).click();
  await expect(page.getByText("No tienes pendientes")).toBeVisible();
});
