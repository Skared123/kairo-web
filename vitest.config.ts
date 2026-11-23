import { defineConfig } from "vitest/config";

/** Unit tests for pure logic, such as the form schemas (decision 027). Pages are covered by Playwright in e2e/. */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
