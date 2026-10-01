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
};

export type RouteDetail = RouteSummary & {
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
  }[];
};

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
    .select({ tripId: trips.tripId, shapeId: trips.shapeId })
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
