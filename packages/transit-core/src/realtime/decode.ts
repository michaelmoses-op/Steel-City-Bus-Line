import GtfsRealtimeBindings from "gtfs-realtime-bindings";

import type { LiveVehicle, ServiceAlert, TripStopPrediction } from "./types.js";

type TimestampLike = number | { toNumber(): number } | null | undefined;

function toUnixSeconds(value: TimestampLike): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  return value.toNumber();
}

function timestampToIso(seconds: TimestampLike): string | null {
  const unix = toUnixSeconds(seconds);
  if (unix === null) return null;
  return new Date(unix * 1000).toISOString();
}

export async function fetchGtfsRtBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GTFS-RT fetch failed ${url}: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export function decodeVehiclePositions(buffer: Buffer): LiveVehicle[] {
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
  const nowMs = Date.now();
  const maxAgeMs = Number(process.env.RT_MAX_AGE_MS ?? 120_000);

  const vehicles: LiveVehicle[] = [];

  for (const entity of feed.entity) {
    const vehicle = entity.vehicle;
    if (!vehicle?.position) continue;

    const lat = vehicle.position.latitude;
    const lon = vehicle.position.longitude;
    if (lat === undefined || lon === undefined) continue;

    const ts = toUnixSeconds(vehicle.timestamp ?? null);
    const updatedAt = timestampToIso(ts) ?? new Date().toISOString();
    const ageMs = ts !== null ? nowMs - ts * 1000 : maxAgeMs + 1;
    const stale = ageMs > maxAgeMs;

    vehicles.push({
      id: entity.id ?? vehicle.vehicle?.id ?? `${lat},${lon}`,
      routeId: vehicle.trip?.routeId ?? null,
      tripId: vehicle.trip?.tripId ?? null,
      lat,
      lon,
      bearing: vehicle.position.bearing ?? null,
      speedMps: vehicle.position.speed ?? null,
      label: vehicle.vehicle?.label ?? null,
      updatedAt,
      stale,
    });
  }

  return vehicles;
}

export function decodeAlerts(buffer: Buffer): ServiceAlert[] {
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
  const alerts: ServiceAlert[] = [];

  for (const entity of feed.entity) {
    const alert = entity.alert;
    if (!alert) continue;

    const routeIds =
      alert.informedEntity
        ?.map((e) => e.routeId)
        .filter((id): id is string => Boolean(id)) ?? [];

    alerts.push({
      id: entity.id ?? `alert-${alerts.length}`,
      headerText: alert.headerText?.translation?.[0]?.text ?? null,
      descriptionText: alert.descriptionText?.translation?.[0]?.text ?? null,
      severity: alert.severityLevel?.toString() ?? null,
      routeIds,
      activePeriods:
        alert.activePeriod?.map((p) => ({
          start: timestampToIso(p.start),
          end: timestampToIso(p.end),
        })) ?? [],
    });
  }

  return alerts;
}

const ScheduleRelationship =
  GtfsRealtimeBindings.transit_realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship;

export function decodeTripUpdates(buffer: Buffer): TripStopPrediction[] {
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
  const predictions: TripStopPrediction[] = [];

  for (const entity of feed.entity) {
    const tripUpdate = entity.tripUpdate;
    if (!tripUpdate) continue;

    const tripId = tripUpdate.trip?.tripId ?? entity.id;
    if (!tripId) continue;

    const routeId = tripUpdate.trip?.routeId ?? null;

    for (const stu of tripUpdate.stopTimeUpdate ?? []) {
      if (stu.scheduleRelationship === ScheduleRelationship.SKIPPED) continue;
      const stopId = stu.stopId;
      if (!stopId) continue;

      const arrivalUnix = toUnixSeconds(stu.arrival?.time ?? null);
      const departureUnix = toUnixSeconds(stu.departure?.time ?? null);
      const delayRaw = stu.arrival?.delay ?? stu.departure?.delay ?? null;
      const delaySeconds =
        delayRaw !== null && delayRaw !== undefined ? Number(delayRaw) : null;

      if (arrivalUnix === null && departureUnix === null && delaySeconds === null) {
        continue;
      }

      predictions.push({
        tripId,
        routeId,
        stopId,
        arrivalTimeUnix: arrivalUnix,
        departureTimeUnix: departureUnix,
        delaySeconds,
      });
    }
  }

  return predictions;
}
