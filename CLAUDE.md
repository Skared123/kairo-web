# Kairo Web

The web app of Kairo, a job search companion. UI only: every rule and every piece of data lives in `kairo-api`.

The product docs live in the API repo, cloned next to this one (`../kairo-api`, decision 003):

- Product vision, modules and roadmap: `../kairo-api/docs/IDEA.md`
- Technical decisions, including this app's (018 to 022): `../kairo-api/docs/DECISIONS.md`
- Screens and build order of the current version: `../kairo-api/docs/design/v0.1-web.md`
- How to work, git, privacy and hard rules: `../kairo-api/CLAUDE.md`. They apply here unchanged.

@AGENTS.md

## This app

- **Next.js 16** (App Router, Turbopack, Cache Components). Read the relevant guide in `node_modules/next/dist/docs/`
  before writing Next.js code, as `AGENTS.md` says: this version differs from older ones.
- **The browser only calls `/api/*`**, which `next.config.ts` rewrites to the API (decision 018). Server Components
  call `API_URL` directly and forward only the session cookie.
- **Reads in Server Components, writes from Client Components**, then `router.refresh()` (decision 019).
- **API types are generated** from the API's OpenAPI document (decision 020). Never write API types by hand.
- **UI:** Tailwind CSS 4 and shadcn/ui (decision 021). Add components with `pnpm dlx shadcn@latest add <name>`.
- **Languages:** Spanish (default) and English with next-intl, the locale in the URL (decision 023). Every UI string
  goes in `messages/es.json` and `messages/en.json` with the same keys; never write UI text in a component. Use
  `Link`, `redirect`, `useRouter` and `usePathname` from `@/i18n/navigation`, not from `next/*`.
- **Forms:** React Hook Form and zod with the `TextField` component (decision 024). Schemas mirror the API's rules.
- **Theme:** next-themes, toggled by the `Switch` in `PreferencesBar` (decision 025).
- **Request-time data** (the session, `needsSetup`) is read behind `<Suspense>`: Cache Components refuses it in the
  prerendered shell. Session reads go through `getCurrentUser()`; public endpoints through `publicServerApi()`.
- **Signed-in pages** live in `app/[locale]/(app)/` and call `requireUser()` (admin pages: `requireAdmin()`, with
  everything admin-only inside the gated component); guest pages (sign-in, setup) live in
  `(auth)/` and are listed in `GUEST_PAGES` in `proxy.ts`, which sends guests without a session cookie to sign-in.
- **The current time** is only read in the browser (Cache Components refuses it on the server): dates go through
  `ClientDate`, and anything comparing with "now" mounts client-side.
- **The API decides.** Hiding a button is UX, not security: every check that matters is in the API.

## Tooling

- pnpm only (10 or later); never npm or yarn. `pnpm-workspace.yaml` lists the dependency install scripts that were
  reviewed; explain any new one before approving it.
- Lint is ESLint with the Next.js rules (`pnpm lint`).
