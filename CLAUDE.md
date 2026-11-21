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
- **UI:** Tailwind CSS 4 and shadcn/ui (decision 021).
- **The API decides.** Hiding a button is UX, not security: every check that matters is in the API.

## Tooling

- pnpm only (10 or later); never npm or yarn. `pnpm-workspace.yaml` lists the dependency install scripts that were
  reviewed; explain any new one before approving it.
- Lint is ESLint with the Next.js rules (`pnpm lint`).
