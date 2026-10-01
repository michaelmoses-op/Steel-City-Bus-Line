import type { Db } from "@steel-city/db";
import { findNearbyStops, getRouteDetail, listRoutes } from "@steel-city/transit-core";
import { Hono } from "hono";
import { z } from "zod";

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(50).max(5000).optional().default(500),
});

export function createV1Routes(getDatabase: () => Db | null) {
  const v1 = new Hono();

  v1.get("/routes", async (c) => {
    const db = getDatabase();
    if (!db) {
      return c.json({ error: "Database not configured" }, 503);
    }
    const routes = await listRoutes(db);
    return c.json({ routes });
  });

  v1.get("/routes/:routeId", async (c) => {
    const db = getDatabase();
    if (!db) {
      return c.json({ error: "Database not configured" }, 503);
    }
    const routeId = c.req.param("routeId");
    const route = await getRouteDetail(routeId, db);
    if (!route) {
      return c.json({ error: "Route not found" }, 404);
    }
    return c.json(route);
  });

  v1.get("/stops/nearby", async (c) => {
    const db = getDatabase();
    if (!db) {
      return c.json({ error: "Database not configured" }, 503);
    }

    const parsed = nearbyQuerySchema.safeParse({
      lat: c.req.query("lat"),
      lon: c.req.query("lon"),
      radius: c.req.query("radius"),
    });

    if (!parsed.success) {
      return c.json({ error: "Invalid query", details: parsed.error.flatten() }, 400);
    }

    const { lat, lon, radius } = parsed.data;
    const stops = await findNearbyStops(lat, lon, radius, db);
    return c.json({ stops });
  });

  return v1;
}
