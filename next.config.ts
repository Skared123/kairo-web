import type { NextConfig } from "next";

/** Where the Kairo API listens. The browser never calls it directly (decision 018). */
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

export default nextConfig;
