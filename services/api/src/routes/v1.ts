import type { Db } from "@steel-city/db";
import {
  filterAlertsForRoute,
  findNearbyStops,
  geocodePlace,
  getArrivalsForStop,
  getRouteDetail,
  getStopDetail,
  listRoutes,
  planTripWithOtp,
  readSnapshot,
  type LiveVehicle,
  type RedisLike,
} from "@steel-city/transit-core";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(50).max(5000).optional().default(500),
});

const planQuerySchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLon: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLon: z.coerce.number().min(-180).max(180),
  timeMode: z.enum(["leave_now", "depart_at", "arrive_by"]),
  dateTime: z.string().optional(),
  optimize: z.enum(["best", "fewest_transfers"]),
  walkPreference: z.enum(["default", "less"]).optional().default("less"),
  fromLabel: z.string().optional(),
  toLabel: z.string().optional(),
});

export type V1Deps = {
  getDatabase: () => Db | null;
  getRedis: () => RedisLike | null;
};

function filterVehicles(vehicles: LiveVehicle[], routeId: string | undefined): LiveVehicle[] {
  if (!routeId) return vehicles;
  return vehicles.filter((v) => v.routeId === routeId);
}

export function createV1Routes(deps: V1Deps) {
  const v1 = new Hono();

  v1.get("/routes", async (c) => {
    const db = deps.getDatabase();
    if (!db) {
      return c.json({ error: "Database not configured" }, 503);
    }
    const routes = await listRoutes(db);
    return c.json({ routes });
  });

  v1.get("/routes/:routeId", async (c) => {
    const db = deps.getDatabase();
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
    const db = deps.getDatabase();
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

  v1.get("/stops/:stopId/arrivals", async (c) => {
    const db = deps.getDatabase();
    const redis = deps.getRedis();
    if (!db || !redis) {
      return c.json({ error: "Realtime or database not configured" }, 503);
    }

    const stopId = c.req.param("stopId");
    const stop = await getStopDetail(stopId, db);
    if (!stop) {
      return c.json({ error: "Stop not found" }, 404);
    }

    const snapshot = await readSnapshot(redis);
    const rows = getArrivalsForStop(stopId, snapshot?.tripPredictions ?? []);
    const routeById = new Map(stop.routes.map((r) => [r.routeId, r]));

    const arrivals = rows.map((row) => {
      const route = row.routeId ? routeById.get(row.routeId) : undefined;
      return {
        tripId: row.tripId,
        routeId: row.routeId,
        routeShortName: route?.routeShortName ?? null,
        routeLongName: route?.routeLongName ?? null,
        arrivalTime: row.arrivalTime,
        departureTime: row.departureTime,
        delaySeconds: row.delaySeconds,
        minutesUntil: row.minutesUntil,
      };
    });

    return c.json({
      stopId,
      arrivals,
      fetchedAt: snapshot?.fetchedAt ?? null,
    });
  });

  v1.get("/stops/:stopId", async (c) => {
    const db = deps.getDatabase();
    if (!db) {
      return c.json({ error: "Database not configured" }, 503);
    }
    const stop = await getStopDetail(c.req.param("stopId"), db);
    if (!stop) {
      return c.json({ error: "Stop not found" }, 404);
    }
    return c.json(stop);
  });

  v1.get("/vehicles", async (c) => {
    const redis = deps.getRedis();
    if (!redis) {
      return c.json({ error: "Realtime cache not configured" }, 503);
    }
    const snapshot = await readSnapshot(redis);
    const routeId = c.req.query("routeId");
    const vehicles = filterVehicles(snapshot?.vehicles ?? [], routeId);
    return c.json({
      vehicles,
      fetchedAt: snapshot?.fetchedAt ?? null,
    });
  });

  v1.get("/vehicles/stream", (c) => {
    const redis = deps.getRedis();
    if (!redis) {
      return c.json({ error: "Realtime cache not configured" }, 503);
    }

    const routeId = c.req.query("routeId");
    const intervalMs = Number(process.env.SSE_INTERVAL_MS ?? 5000);

    return streamSSE(c, async (stream) => {
      while (true) {
        const snapshot = await readSnapshot(redis);
        const vehicles = filterVehicles(snapshot?.vehicles ?? [], routeId);
        await stream.writeSSE({
          event: "vehicles",
          data: JSON.stringify({ vehicles, fetchedAt: snapshot?.fetchedAt ?? null }),
        });
        await stream.sleep(intervalMs);
      }
    });
  });

  v1.get("/alerts", async (c) => {
    const redis = deps.getRedis();
    if (!redis) {
      return c.json({ error: "Realtime cache not configured" }, 503);
    }
    const snapshot = await readSnapshot(redis);
    const routeId = c.req.query("routeId");
    let alerts = snapshot?.alerts ?? [];
    if (routeId) {
      alerts = filterAlertsForRoute(alerts, routeId);
    }
    return c.json({
      alerts,
      fetchedAt: snapshot?.fetchedAt ?? null,
    });
  });

  v1.get("/geocode", async (c) => {
    const q = c.req.query("q") ?? "";
    try {
      const results = await geocodePlace(q);
      return c.json({ results });
    } catch (err) {
      console.error("[api] geocode failed", err);
      return c.json({ error: "Geocoding unavailable" }, 502);
    }
  });

  v1.get("/plan", async (c) => {
    const otpBase = process.env.OTP_BASE_URL;
    if (!otpBase) {
      return c.json(
        {
          error: "Trip planner not configured",
          hint: "Set OTP_BASE_URL and run OpenTripPlanner with PRT GTFS (see README).",
        },
        503,
      );
    }

    const parsed = planQuerySchema.safeParse({
      fromLat: c.req.query("fromLat"),
      fromLon: c.req.query("fromLon"),
      toLat: c.req.query("toLat"),
      toLon: c.req.query("toLon"),
      timeMode: c.req.query("timeMode"),
      dateTime: c.req.query("dateTime"),
      optimize: c.req.query("optimize"),
      walkPreference: c.req.query("walkPreference"),
      fromLabel: c.req.query("fromLabel"),
      toLabel: c.req.query("toLabel"),
    });

    if (!parsed.success) {
      return c.json({ error: "Invalid query", details: parsed.error.flatten() }, 400);
    }

    const {
      fromLat,
      fromLon,
      toLat,
      toLon,
      timeMode,
      dateTime,
      optimize,
      walkPreference,
      fromLabel,
      toLabel,
    } = parsed.data;

    if (timeMode !== "leave_now" && !dateTime) {
      return c.json({ error: "dateTime required for depart_at and arrive_by" }, 400);
    }

    try {
      let planFromLat = fromLat;
      let planFromLon = fromLon;
      let planToLat = toLat;
      let planToLon = toLon;
      let accessNote: string | null = null;

      const db = deps.getDatabase();
      const stopSnapRadius = walkPreference === "less" ? 1200 : 600;
      if (db) {
        const [fromStops, toStops] = await Promise.all([
          findNearbyStops(fromLat, fromLon, stopSnapRadius, db),
          findNearbyStops(toLat, toLon, stopSnapRadius, db),
        ]);
        if (fromStops[0]) {
          planFromLat = fromStops[0].lat;
          planFromLon = fromStops[0].lon;
        }
        if (toStops[0]) {
          planToLat = toStops[0].lat;
          planToLon = toStops[0].lon;
        }
        if (fromStops[0] || toStops[0]) {
          accessNote = "Trip planning uses the nearest bus stops to your chosen points (walk shown in legs when OSM is loaded).";
        }
      }

      const { itineraries, plannerNote } = await planTripWithOtp(otpBase, {
        fromLat: planFromLat,
        fromLon: planFromLon,
        toLat: planToLat,
        toLon: planToLon,
        timeMode,
        dateTime,
        optimize,
        walkPreference,
      });

      const combinedNote =
        [accessNote, plannerNote].filter(Boolean).join(" ") || null;

      return c.json({
        from: { lat: fromLat, lon: fromLon, label: fromLabel ?? null },
        to: { lat: toLat, lon: toLon, label: toLabel ?? null },
        itineraries,
        plannerNote: combinedNote,
      });
    } catch (err) {
      console.error("[api] plan failed", err);
      const refused =
        err instanceof Error &&
        "cause" in err &&
        err.cause instanceof AggregateError &&
        err.cause.errors.some(
          (e) => e instanceof Error && "code" in e && e.code === "ECONNREFUSED",
        );
      const message = refused
        ? "Trip planner is not reachable. Run pnpm otp:up and ensure OTP is listening on OTP_BASE_URL."
        : err instanceof Error
          ? err.message
          : "Trip planning failed";
      return c.json({ error: message }, 502);
    }
  });

  return v1;
}
