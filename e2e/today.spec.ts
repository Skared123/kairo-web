import { ADMIN, day, expect, signIn, test } from "./fixtures";

test("is the home page, with an invitation when nothing is pending", async ({ page, api }) => {
  await api.setupAdmin();
  await signIn(page, ADMIN.email, ADMIN.password);

  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { name: "Hoy", level: 1 })).toBeVisible();
  await expect(page.getByText("No tienes pendientes")).toBeVisible();
  await page.getByRole("link", { name: "Ir a vacantes" }).click();
  await expect(page).toHaveURL(/\/es\/jobs$/);

  // The header leads back.
  await page.getByRole("link", { name: "Hoy" }).click();
  await expect(page.getByText("No tienes pendientes")).toBeVisible();
});

test("sorts tasks and follow-ups into their sections by the browser's day", async ({ page, api }) => {
  await api.setupAdmin();
  const job = await api.createJob({
    company: "Acme Robotics",
    title: "Senior Fullstack Engineer",
    status: "interviewing",
    nextFollowUpOn: day(0),
    nextFollowUpNote: "Preguntar por la segunda ronda",
  });
  await api.createJob({ company: "Globex", title: "Backend Engineer", nextFollowUpOn: day(-2) });
  await api.createTask({ title: "Preparar la entrevista técnica", dueOn: day(0), jobId: job });
  await api.createTask({ title: "Mandar el CV actualizado", dueOn: day(3) });
  await api.createTask({ title: "Escribir un post en LinkedIn" });
  await api.createTask({ title: "Renovar el portafolio", dueOn: day(30) });
  const done = await api.createTask({ title: "Responder el correo de Initech" });
  await api.updateTask(done, { done: true });
  await signIn(page, ADMIN.email, ADMIN.password);

  const section = (name: RegExp) => page.getByRole("region", { name });

  const overdue = section(/^Atrasado · 1$/);
  await expect(overdue).toContainText("Seguimiento: Globex · Backend Engineer");

  const today = section(/^Hoy · 2$/);
  await expect(today.getByRole("listitem")).toHaveCount(2);
  // The follow-up first, then the task, which links to its job.
  await expect(today.getByRole("listitem").nth(0)).toContainText("Preguntar por la segunda ronda");
  await expect(today.getByRole("listitem").nth(1)).toContainText("Preparar la entrevista técnica");
  await expect(today.getByRole("listitem").nth(1)).toContainText("Acme Robotics · Senior Fullstack Engineer");

  await expect(section(/^Próximos 7 días · 1$/)).toContainText("Mandar el CV actualizado");
  await expect(section(/^Sin fecha · 1$/)).toContainText("Escribir un post en LinkedIn");

  // Further ahead, and done today: collapsed until opened.
  const later = section(/^Más adelante · 1$/);
  await expect(later.getByText("Renovar el portafolio")).toBeHidden();
  await later.getByText("Más adelante · 1").click();
  await expect(later.getByText("Renovar el portafolio")).toBeVisible();

  const doneToday = section(/^Terminadas hoy · 1$/);
  await doneToday.getByText("Terminadas hoy · 1").click();
  await expect(doneToday.getByText("Responder el correo de Initech")).toBeVisible();

  // A follow-up leads to its job.
  await today.getByRole("link", { name: "Acme Robotics · Senior Fullstack Engineer" }).first().click();
  await expect(page.getByRole("main").getByRole("heading", { name: "Senior Fullstack Engineer" })).toBeVisible();
});

test("shows Today in English", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createTask({ title: "Send the updated CV", dueOn: day(0) });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/en");

  await expect(page.getByRole("heading", { name: "Today", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Today · 1" })).toContainText("Send the updated CV");
});

test("never shows another user's tasks, follow-ups or study focus", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createJob({ company: "Acme", title: "Engineer", nextFollowUpOn: day(0) });
  await api.createTask({ title: "Preparar la entrevista", dueOn: day(0) });
  await api.createContact({ name: "Margaret Hamilton", nextFollowUpOn: day(0) });
  await api.createLearningItem({ title: "NestJS Fundamentals", isFocus: true });
  const temporary = await api.createAccount("Grace Hopper", "grace@example.com");
  await api.choosePassword("grace@example.com", temporary, "abc123");

  await signIn(page, "grace@example.com", "abc123");
  await expect(page.getByText("No tienes pendientes")).toBeVisible();
  await expect(page.getByText("Preparar la entrevista")).toHaveCount(0);
  await expect(page.getByText("Margaret Hamilton")).toHaveCount(0);
  await expect(page.getByText("NestJS Fundamentals")).toHaveCount(0);
});

/** Today's calendar day in `timeZone`, `offset` days after, as YYYY-MM-DD. */
function dayIn(timeZone: string, offset = 0): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

// Two browsers 25 hours apart are never on the same day, whatever the time of this run.
const AHEAD = "Pacific/Kiritimati"; // UTC+14
const BEHIND = "Pacific/Pago_Pago"; // UTC-11

test.describe("in a browser far ahead (API decision 035)", () => {
  test.use({ timezoneId: AHEAD });

  test("sorts by the browser's day, not the server's", async ({ page, api }) => {
    await api.setupAdmin();
    await api.createTask({ title: "Preparar la entrevista técnica", dueOn: dayIn(AHEAD) });
    await api.createTask({ title: "Mandar el CV actualizado", dueOn: dayIn(AHEAD, -1) });
    await signIn(page, ADMIN.email, ADMIN.password);

    await expect(page.getByRole("region", { name: /^Hoy · 1$/ })).toContainText("Preparar la entrevista técnica");
    await expect(page.getByRole("region", { name: /^Atrasado · 1$/ })).toContainText("Mandar el CV actualizado");
  });
});

test.describe("in a browser far behind (API decision 035)", () => {
  test.use({ timezoneId: BEHIND });

  test("sees the same task further ahead", async ({ page, api }) => {
    await api.setupAdmin();
    // Today for the browser far ahead is still to come here.
    await api.createTask({ title: "Preparar la entrevista técnica", dueOn: dayIn(AHEAD) });
    await signIn(page, ADMIN.email, ADMIN.password);

    await expect(page.getByRole("region", { name: /^Próximos 7 días · 1$/ })).toContainText(
      "Preparar la entrevista técnica",
    );
  });
});

test("shows the study focus under the date, and nothing without one", async ({ page, api }) => {
  await api.setupAdmin();
  const nest = await api.createLearningItem({
    title: "NestJS Fundamentals",
    kind: "course",
    url: "https://example.com/nestjs",
    status: "in_progress",
    skills: ["TypeScript", "NestJS"],
  });
  await signIn(page, ADMIN.email, ADMIN.password);

  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Hoy", level: 1 })).toBeVisible();
  await expect(main.getByText("No tienes pendientes")).toBeVisible();
  await expect(main.getByRole("region", { name: "Tu foco de estudio" })).toHaveCount(0);

  await api.updateLearningItem(nest, { isFocus: true });
  await page.reload();
  const focus = main.getByRole("region", { name: "Tu foco de estudio" });
  // The title opens the item's link; its skills come by name.
  await expect(focus.getByRole("link", { name: "NestJS Fundamentals" })).toHaveAttribute(
    "href",
    "https://example.com/nestjs",
  );
  await expect(focus).toContainText("Curso · En curso");
  await expect(focus.getByText("NestJS", { exact: true })).toBeVisible();
  await expect(focus.getByText("TypeScript", { exact: true })).toBeVisible();

  await focus.getByRole("link", { name: "Ir a aprendizaje" }).click();
  await expect(main.getByRole("heading", { name: "Aprendizaje", level: 1 })).toBeVisible();

  // Finishing it takes it off Today.
  await api.updateLearningItem(nest, { status: "done" });
  await page.goto("/es");
  await expect(main.getByText("No tienes pendientes")).toBeVisible();
  await expect(main.getByRole("region", { name: "Tu foco de estudio" })).toHaveCount(0);
});

test("shows a focus without a link, in English", async ({ page, api }) => {
  await api.setupAdmin();
  await api.createLearningItem({ title: "Build a CLI in Go", kind: "project", isFocus: true });
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto("/en");

  const focus = page.getByRole("main").getByRole("region", { name: "Your study focus" });
  await expect(focus).toContainText("Build a CLI in Go");
  await expect(focus.getByRole("link", { name: "Build a CLI in Go" })).toHaveCount(0);
  await expect(focus).toContainText("Project · To start");
  await expect(focus.getByRole("link", { name: "Go to learning" })).toBeVisible();
});
