import { routes, shapePoints, stopTimes, stops, trips, type Db } from "@steel-city/db";
import { asc, eq, sql } from "drizzle-orm";

export type RouteSummary = {
  routeId: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeType: number;
  routeColor: string | null;
  routeTextColor: string | null;
};

export type StopOnRoute = {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
  stopSequence: number;
  arrivalTime: string | null;
  departureTime: string | null;
};

export type RouteDetail = RouteSummary & {
  tripHeadsign: string | null;
  scheduleNote: string;
  stops: StopOnRoute[];
  shape: { lat: number; lon: number }[] | null;
};

export type NearbyStop = {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
  distanceM: number;
};

export type StopDetail = {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
  routes: {
    routeId: string;
    routeShortName: string | null;
    routeLongName: string | null;
    routeColor: string | null;
    routeTextColor: string | null;
  }[];
};

export type RouteMapShape = {
  routeId: string;
  routeShortName: string | null;
  routeColor: string | null;
  shape: { lat: number; lon: number }[];
};

const MAP_SHAPE_MAX_POINTS = 72;

function simplifyShape(
  points: { lat: number; lon: number }[],
  maxPoints = MAP_SHAPE_MAX_POINTS,
): { lat: number; lon: number }[] {
  if (points.length <= maxPoints) return points;
  const out: { lat: number; lon: number }[] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * (points.length - 1));
    out.push(points[idx]!);
  }
  return out;
}

/** One representative shape per route for map overlay (downsampled). */
export async function listRouteMapShapes(db: Db): Promise<RouteMapShape[]> {
  const result = await db.execute<{
    route_id: string;
    route_short_name: string | null;
    route_color: string | null;
    lat: number;
    lon: number;
    shape_pt_sequence: number;
  }>(sql`
    WITH rep AS (
      SELECT DISTINCT ON (t.route_id) t.route_id, t.shape_id
      FROM trips t
      WHERE t.shape_id IS NOT NULL
      ORDER BY t.route_id, t.trip_id
    )
    SELECT
      r.route_id,
      r.route_short_name,
      r.route_color,
      sp.lat,
      sp.lon,
      sp.shape_pt_sequence
    FROM rep
    INNER JOIN routes r ON r.route_id = rep.route_id
    INNER JOIN shape_points sp ON sp.shape_id = rep.shape_id
    ORDER BY r.route_id, sp.shape_pt_sequence
  `);

  const byRoute = new Map<
    string,
    { routeShortName: string | null; routeColor: string | null; points: { lat: number; lon: number }[] }
  >();

  for (const row of result) {
    let entry = byRoute.get(row.route_id);
    if (!entry) {
      entry = {
        routeShortName: row.route_short_name,
        routeColor: row.route_color,
        points: [],
      };
      byRoute.set(row.route_id, entry);
    }
    entry.points.push({ lat: row.lat, lon: row.lon });
  }

  const shapes: RouteMapShape[] = [];
  for (const [routeId, entry] of byRoute) {
    if (entry.points.length < 2) continue;
    shapes.push({
      routeId,
      routeShortName: entry.routeShortName,
      routeColor: entry.routeColor,
      shape: simplifyShape(entry.points),
    });
  }

  shapes.sort((a, b) =>
    (a.routeShortName ?? a.routeId).localeCompare(b.routeShortName ?? b.routeId, undefined, {
      numeric: true,
    }),
  );

  return shapes;
}

export async function listRoutes(db: Db): Promise<RouteSummary[]> {
  const rows = await db
    .select({
      routeId: routes.routeId,
      routeShortName: routes.routeShortName,
      routeLongName: routes.routeLongName,
      routeType: routes.routeType,
      routeColor: routes.routeColor,
      routeTextColor: routes.routeTextColor,
    })
    .from(routes)
    .orderBy(asc(routes.routeShortName), asc(routes.routeId));

  return rows;
}

export async function getRouteDetail(routeId: string, db: Db): Promise<RouteDetail | null> {
  const routeRows = await db.select().from(routes).where(eq(routes.routeId, routeId)).limit(1);
  const route = routeRows[0];
  if (!route) {
    return null;
  }

  const tripRows = await db
    .select({
      tripId: trips.tripId,
      shapeId: trips.shapeId,
      tripHeadsign: trips.tripHeadsign,
    })
    .from(trips)
    .where(eq(trips.routeId, routeId))
    .limit(1);

  const trip = tripRows[0];
  let stopsOnRoute: StopOnRoute[] = [];

  if (trip) {
    stopsOnRoute = await db
      .select({
        stopId: stops.stopId,
        stopName: stops.stopName,
        lat: stops.lat,
        lon: stops.lon,
        stopSequence: stopTimes.stopSequence,
        arrivalTime: stopTimes.arrivalTime,
        departureTime: stopTimes.departureTime,
      })
      .from(stopTimes)
      .innerJoin(stops, eq(stopTimes.stopId, stops.stopId))
      .where(eq(stopTimes.tripId, trip.tripId))
      .orderBy(asc(stopTimes.stopSequence));
  }

  let shape: { lat: number; lon: number }[] | null = null;
  if (trip?.shapeId) {
    const points = await db
      .select({ lat: shapePoints.lat, lon: shapePoints.lon })
      .from(shapePoints)
      .where(eq(shapePoints.shapeId, trip.shapeId))
      .orderBy(asc(shapePoints.shapePtSequence));
    shape = points.length > 0 ? points : null;
  }

  return {
    routeId: route.routeId,
    routeShortName: route.routeShortName,
    routeLongName: route.routeLongName,
    routeType: route.routeType,
    routeColor: route.routeColor,
    routeTextColor: route.routeTextColor,
    tripHeadsign: trip?.tripHeadsign ?? null,
    scheduleNote:
      "Scheduled times from one representative trip in the current GTFS bundle. Live arrivals may differ.",
    stops: stopsOnRoute,
    shape,
  };
}

export async function getStopDetail(stopId: string, db: Db): Promise<StopDetail | null> {
  const stopRows = await db.select().from(stops).where(eq(stops.stopId, stopId)).limit(1);
  const stop = stopRows[0];
  if (!stop) {
    return null;
  }

  const routeRows = await db
    .selectDistinct({
      routeId: routes.routeId,
      routeShortName: routes.routeShortName,
      routeLongName: routes.routeLongName,
      routeColor: routes.routeColor,
      routeTextColor: routes.routeTextColor,
    })
    .from(stopTimes)
    .innerJoin(trips, eq(stopTimes.tripId, trips.tripId))
    .innerJoin(routes, eq(trips.routeId, routes.routeId))
    .where(eq(stopTimes.stopId, stopId))
    .orderBy(asc(routes.routeShortName));

  return {
    stopId: stop.stopId,
    stopName: stop.stopName,
    lat: stop.lat,
    lon: stop.lon,
    routes: routeRows,
  };
}

export async function findNearbyStops(
  lat: number,
  lon: number,
  radiusM: number,
  db: Db,
): Promise<NearbyStop[]> {
  const result = await db.execute<{
    stop_id: string;
    stop_name: string;
    lat: number;
    lon: number;
    distance_m: number;
  }>(sql`
    SELECT
      s.stop_id,
      s.stop_name,
      s.lat,
      s.lon,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(s.lon, s.lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
      ) AS distance_m
    FROM stops s
    WHERE ST_DWithin(
      ST_SetSRID(ST_MakePoint(s.lon, s.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
      ${radiusM}
    )
    ORDER BY distance_m
    LIMIT 50
  `);

  return result.map((row) => ({
    stopId: row.stop_id,
    stopName: row.stop_name,
    lat: row.lat,
    lon: row.lon,
    distanceM: Math.round(row.distance_m),
  }));
}
