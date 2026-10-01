import { config } from "dotenv";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

async function migrate(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(url, { max: 1 });

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    const existing = await sql`
      SELECT id FROM schema_migrations WHERE id = ${id}
    `;
    if (existing.length > 0) {
      console.log(`[migrate] skip ${file}`);
      continue;
    }

    const body = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`[migrate] apply ${file}`);
    await sql.unsafe(body);
    await sql`INSERT INTO schema_migrations (id) VALUES (${id})`;
  }

  await sql.end();
  console.log("[migrate] done");
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
