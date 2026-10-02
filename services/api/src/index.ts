import "./load-env.js";

import { serve } from "@hono/node-server";
import { createDb, type Db } from "@steel-city/db";
import { getRedis, TRANSIT_CORE_VERSION, type RedisLike } from "@steel-city/transit-core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { resolveCorsOrigin } from "./cors.js";
import { createV1Routes } from "./routes/v1.js";

let db: Db | null = null;
let redis: RedisLike | null = null;

try {
  const url = process.env.DATABASE_URL;
  if (url) {
    db = createDb(url);
    console.log("[api] database connected");
  } else {
    console.warn("[api] DATABASE_URL not set — static routes unavailable");
  }
} catch (err) {
  console.error("[api] database connection failed", err);
  db = null;
}

if (process.env.REDIS_URL) {
  getRedis()
    .then((client) => {
      redis = client;
      console.log("[api] redis connected");
    })
    .catch((err) => {
      console.error("[api] redis connection failed", err);
    });
} else {
  console.warn("[api] REDIS_URL not set — live vehicles unavailable");
}

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: (origin) => resolveCorsOrigin(origin),
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true as const,
    service: "api",
    transitCore: TRANSIT_CORE_VERSION,
    database: db !== null,
    redis: redis !== null,
  }),
);

app.get("/api/v1/health", (c) =>
  c.json({
    ok: true as const,
    version: "v1",
    service: "api",
    database: db !== null,
    redis: redis !== null,
  }),
);

app.route(
  "/api/v1",
  createV1Routes({
    getDatabase: () => db,
    getRedis: () => redis,
  }),
);

const port = Number(process.env.PORT ?? 4000);

console.log(`[api] listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
