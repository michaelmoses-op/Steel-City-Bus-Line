import {
  routes,
  shapePoints,
  stopTimes,
  stops,
  trips,
  type Db,
} from "@steel-city/db";
import { sql } from "drizzle-orm";
import type { GtfsStaticTables } from "./import-types.js";
import {
  normalizeRoute,
  normalizeShapePoint,
  normalizeStop,
  normalizeStopTime,
  normalizeTrip,
} from "./normalize.js";

const BATCH_SIZE = 5000;

function logBatch(table: string, done: number, total: number): void {
  const pct = total > 0 ? Math.round((done / total) * 100) : 100;
  console.log(`[import-gtfs] ${table}: ${done.toLocaleString()} / ${total.toLocaleString()} (${pct}%)`);
}

export type ImportGtfsResult = {
  routes: number;
  stops: number;
  trips: number;
  stopTimes: number;
  shapePoints: number;
};

export async function importGtfsTables(db: Db, tables: GtfsStaticTables): Promise<ImportGtfsResult> {
  const normalizedRoutes = tables.routes.map(normalizeRoute);
  const normalizedStops = tables.stops.map(normalizeStop);
  const normalizedTrips = tables.trips.map(normalizeTrip);
  const normalizedStopTimes = tables.stopTimes.map(normalizeStopTime);
  const normalizedShapes = tables.shapes.map(normalizeShapePoint);

  console.log("[import-gtfs] truncating existing tables…");
  await db.execute(sql`
    TRUNCATE shape_points, stop_times, trips, stops, routes CASCADE
  `);

  for (let i = 0; i < normalizedRoutes.length; i += BATCH_SIZE) {
    await db.insert(routes).values(normalizedRoutes.slice(i, i + BATCH_SIZE));
  }
  logBatch("routes", normalizedRoutes.length, normalizedRoutes.length);

  for (let i = 0; i < normalizedStops.length; i += BATCH_SIZE) {
    await db.insert(stops).values(normalizedStops.slice(i, i + BATCH_SIZE));
  }
  logBatch("stops", normalizedStops.length, normalizedStops.length);

  for (let i = 0; i < normalizedTrips.length; i += BATCH_SIZE) {
    await db.insert(trips).values(normalizedTrips.slice(i, i + BATCH_SIZE));
  }
  logBatch("trips", normalizedTrips.length, normalizedTrips.length);

  for (let i = 0; i < normalizedStopTimes.length; i += BATCH_SIZE) {
    await db.insert(stopTimes).values(normalizedStopTimes.slice(i, i + BATCH_SIZE));
    const done = Math.min(i + BATCH_SIZE, normalizedStopTimes.length);
    if (done === normalizedStopTimes.length || i === 0 || done % 50_000 < BATCH_SIZE) {
      logBatch("stop_times", done, normalizedStopTimes.length);
    }
  }

  for (let i = 0; i < normalizedShapes.length; i += BATCH_SIZE) {
    await db.insert(shapePoints).values(normalizedShapes.slice(i, i + BATCH_SIZE));
    const done = Math.min(i + BATCH_SIZE, normalizedShapes.length);
    if (done === normalizedShapes.length || i === 0 || done % 50_000 < BATCH_SIZE) {
      logBatch("shape_points", done, normalizedShapes.length);
    }
  }

  return {
    routes: normalizedRoutes.length,
    stops: normalizedStops.length,
    trips: normalizedTrips.length,
    stopTimes: normalizedStopTimes.length,
    shapePoints: normalizedShapes.length,
  };
}
