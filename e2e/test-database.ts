import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";
import { Client } from "pg";

/**
 * The API's end-to-end database: TEST_DATABASE_URL from the environment, else from ../kairo-api/.env.
 * Refuses any database whose name does not end in _test, so the tests can never wipe real data (decision 027).
 */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? readApiEnv().TEST_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set: add it to ../kairo-api/.env (see its .env.example).");
  }
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to use "${name}" for end-to-end tests: the database name must end in _test.`);
  }
  return url;
}

function readApiEnv(): Record<string, string | undefined> {
  try {
    // Playwright runs from kairo-web's root, next to ../kairo-api (decision 003).
    return parseEnv(readFileSync(join(process.cwd(), "..", "kairo-api", ".env"), "utf8"));
  } catch {
    return {};
  }
}

/** Empties every table but the migrations log, so each test starts from a fresh install. */
export async function resetDatabase(): Promise<void> {
  const client = new Client({ connectionString: testDatabaseUrl() });
  await client.connect();
  try {
    const { rows } = await client.query<{ name: string }>(
      `SELECT current_database() AS name`,
    );
    if (!rows[0].name.endsWith("_test")) {
      throw new Error(`Refusing to reset "${rows[0].name}": only *_test databases can be reset.`);
    }
    const tables = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations'`,
    );
    if (tables.rows.length) {
      const list = tables.rows.map((t) => `"${t.tablename}"`).join(", ");
      await client.query(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
    }
  } finally {
    await client.end();
  }
}
