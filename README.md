# Kairo Web

The web app of Kairo, a job search companion: track applications, get prepared, and act on the right opportunity in
time. It talks to [`kairo-api`](https://github.com/Skared123/kairo-api), which holds the product docs.

> **Status:** v0.1 Accounts, skeleton. The screens come next.

## Getting started

Start the API first (see its README), then:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs on [http://localhost:3000](http://localhost:3000). Requests to `/api/*` are forwarded to the API at
`API_URL` (`http://localhost:4000` by default).

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Development server with Turbopack |
| `pnpm build` / `pnpm start` | Production build, and serving it |
| `pnpm lint` | ESLint with the Next.js rules |

## License

Private for now; not licensed for reuse.
