import "./load-env.js";

import { serve } from "@hono/node-server";
import { createDb, type Db } from "@steel-city/db";
import { TRANSIT_CORE_VERSION } from "@steel-city/transit-core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createV1Routes } from "./routes/v1.js";

let db: Db | null = null;

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

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true as const,
    service: "api",
    transitCore: TRANSIT_CORE_VERSION,
    database: db !== null,
  }),
);

app.get("/api/v1/health", (c) =>
  c.json({
    ok: true as const,
    version: "v1",
    service: "api",
    database: db !== null,
  }),
);

app.route("/api/v1", createV1Routes(() => db));

const port = Number(process.env.PORT ?? 4000);

console.log(`[api] listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
