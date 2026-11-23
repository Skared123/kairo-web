import { defineConfig, devices } from "@playwright/test";
import { API_PORT, API_URL, WEB_PORT, WEB_URL } from "./e2e/env";
import { testDatabaseUrl } from "./e2e/test-database";

/**
 * End-to-end tests (decision 027): a real browser against a production build of the web app and the real API,
 * on the kairo_test database, emptied before each test.
 */
export default defineConfig({
  testDir: "./e2e",
  // One database for every test, so they run one after another.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: WEB_URL,
    // A Spanish-speaking browser, so `/` lands on /es like it does for the author.
    locale: "es-MX",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // The API from the sibling repository, migrated onto the test database.
      command:
        "pnpm --dir ../kairo-api build && " +
        "node ../kairo-api/node_modules/typeorm/cli.js migration:run -d ../kairo-api/dist/database/data-source.js && " +
        "node ../kairo-api/dist/main.js",
      url: `${API_URL}/auth/setup`,
      env: { DATABASE_URL: testDatabaseUrl(), PORT: String(API_PORT), WEB_ORIGIN: WEB_URL, NODE_ENV: "test" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // A production build in its own folder, as the Next.js testing guide recommends.
      command: `pnpm build && pnpm start -p ${WEB_PORT}`,
      url: `${WEB_URL}/icon`,
      env: { API_URL, NEXT_DIST_DIR: ".next-e2e" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
