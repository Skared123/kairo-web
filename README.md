# Kairo Web

The web app of Kairo, a job search companion: track applications, get prepared, and act on the right opportunity in
time. It talks to [`kairo-api`](https://github.com/Skared123/kairo-api), which holds the product docs and every rule.

> **Status:** v0.1 Accounts. First-run setup, sign-in, password changes and account management, in Spanish and
> English. The product idea and roadmap are in `kairo-api/docs/IDEA.md`.

## Stack

- [Next.js 16](https://nextjs.org/docs) with the App Router, Turbopack and Cache Components
- [Tailwind CSS 4](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com) (Radix)
- [next-intl](https://next-intl.dev) for Spanish and English, with the language in the URL (`/es`, `/en`)
- [React Hook Form](https://react-hook-form.com) and [zod](https://zod.dev) for forms
- API types generated from the API's OpenAPI document with `openapi-typescript`, called through `openapi-fetch`
- Playwright and Vitest for tests

Every choice and its alternatives are in `kairo-api/docs/DECISIONS.md` (decisions 018 to 027 are this app's).

## Requirements

- Node.js 22 or later, pnpm 10 or later
- `kairo-api` cloned next to this repository and running (see its README):

```
~/Developer/kairo/
  kairo-api/
  kairo-web/
```

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The first visit leads to the first-run screen, which creates the
admin account; after that, the admin creates every other account from **Admin**.

- **The API.** The browser only calls `/api/*`, which Next.js forwards to `API_URL` (`http://localhost:4000` by
  default). `pnpm build` fixes that address into the build, so rebuild after changing it.
- **Languages.** Spanish by default, English with the switch at the top. The choice is remembered.
- **Theme.** Follows the system until you flip the dark theme switch.
- **Install it.** In Safari, **File → Add to Dock** opens Kairo in its own window.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Development server with Turbopack |
| `pnpm build` / `pnpm start` | Production build, and serving it |
| `pnpm lint` | ESLint with the Next.js rules |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | End-to-end tests (Playwright), see below |
| `pnpm api:types` | Regenerates `lib/api/schema.d.ts` from the running API's OpenAPI document |

## Tests

```bash
pnpm test
pnpm test:e2e
```

The end-to-end tests drive a real browser through the app. They start everything they need on their own ports, so a
running `pnpm dev` and API are never touched:

- the API from `../kairo-api` on port 4100, migrated onto its `kairo_test` database (`TEST_DATABASE_URL` in
  `kairo-api/.env`);
- a production build of this app on port 3100, built into `.next-e2e`.

Each test starts from an empty `kairo_test`, and the tests refuse any database whose name does not end in `_test`.
The database container must be up (`pnpm db:up` in `kairo-api`). The first time, download the browser Playwright uses:

```bash
pnpm exec playwright install chromium
```

After a failure, `pnpm exec playwright show-report` opens the report with a trace of each failed test.

## Project layout

```
app/[locale]/
  (auth)/      first-run setup and sign-in
  (app)/       pages that need a session: home, password, admin/users
components/    shared components; components/ui holds the shadcn/ui ones
i18n/          languages, navigation helpers and message loading
messages/      every UI string, in es.json and en.json
lib/           API clients, session helpers and form schemas
e2e/           Playwright tests and their helpers
proxy.ts       language redirects and the early guest check
```

## License

Private for now; not licensed for reuse.
