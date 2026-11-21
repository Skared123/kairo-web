import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Where the Kairo API listens. The browser never calls it directly (decision 018).
 * The rewrites below are fixed when the app is built: after changing API_URL, rebuild (`pnpm dev` reads it at start).
 */
const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The browser calls /api/* on this origin and Next.js forwards it to the API, so the session cookie is
  // first-party and every request is same-origin (decision 018).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

// Loads i18n/request.ts for every request (decision 023).
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
