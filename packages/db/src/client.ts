import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

export type DbConnection = {
  db: Db;
  close: () => Promise<void>;
};

let cached: DbConnection | null = null;

export type DbConnectionOptions = {
  /** Long-running scripts (e.g. GTFS import): one connection, no idle timeout. */
  singleConnection?: boolean;
};

export function createDbConnection(
  connectionString: string,
  options?: DbConnectionOptions,
): DbConnection {
  const client = postgres(connectionString, {
    max: options?.singleConnection ? 1 : 10,
    idle_timeout: options?.singleConnection ? 0 : 20,
    connect_timeout: options?.singleConnection ? 60 : 30,
  });
  return {
    db: drizzle(client, { schema }),
    close: () => client.end({ timeout: 10 }),
  };
}

/** @deprecated Prefer createDbConnection in scripts that must exit (e.g. gtfs import). */
export function createDb(connectionString: string): Db {
  return createDbConnection(connectionString).db;
}

export function getDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!cached) {
    cached = createDbConnection(url);
  }
  return cached.db;
}

export async function closeDb(): Promise<void> {
  if (cached) {
    await cached.close();
    cached = null;
  }
}
