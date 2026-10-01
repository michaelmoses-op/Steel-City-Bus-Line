import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { TRANSIT_CORE_VERSION } from "@steel-city/transit-core";

const app = new Hono();

app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  }),
);

app.get("/health", (c) =>
  c.json({ ok: true as const, service: "api", transitCore: TRANSIT_CORE_VERSION }),
);

app.get("/api/v1/health", (c) =>
  c.json({ ok: true as const, version: "v1", service: "api" }),
);

const port = Number(process.env.PORT ?? 4000);

console.log(`[api] listening on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
