import type { ServiceAlert, TripStopPrediction } from "./types.js";

export type StopArrivalRow = {
  tripId: string;
  routeId: string | null;
  arrivalTime: string | null;
  departureTime: string | null;
  delaySeconds: number | null;
  minutesUntil: number | null;
};

const DEFAULT_HORIZON_MS = 3 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 24;

function eventToIso(seconds: number | null): string | null {
  if (seconds === null) return null;
  return new Date(seconds * 1000).toISOString();
}

function pickBestTime(
  arrivalIso: string | null,
  departureIso: string | null,
): { iso: string | null; ms: number | null } {
  const candidates: number[] = [];
  if (arrivalIso) candidates.push(new Date(arrivalIso).getTime());
  if (departureIso) candidates.push(new Date(departureIso).getTime());
  if (candidates.length === 0) return { iso: null, ms: null };
  const ms = Math.min(...candidates);
  return { iso: new Date(ms).toISOString(), ms };
}

/** Predictions for one stop, sorted soonest-first. */
export function getArrivalsForStop(
  stopId: string,
  predictions: TripStopPrediction[],
  options?: { nowMs?: number; horizonMs?: number; limit?: number },
): StopArrivalRow[] {
  const nowMs = options?.nowMs ?? Date.now();
  const horizonMs = options?.horizonMs ?? DEFAULT_HORIZON_MS;
  const limit = options?.limit ?? DEFAULT_LIMIT;

  const byTrip = new Map<string, StopArrivalRow>();

  for (const p of predictions) {
    if (p.stopId !== stopId) continue;

    const arrivalIso = eventToIso(p.arrivalTimeUnix);
    const departureIso = eventToIso(p.departureTimeUnix);
    const { iso, ms } = pickBestTime(arrivalIso, departureIso);
    if (ms === null || ms < nowMs - 60_000 || ms > nowMs + horizonMs) continue;

    const row: StopArrivalRow = {
      tripId: p.tripId,
      routeId: p.routeId,
      arrivalTime: arrivalIso,
      departureTime: departureIso,
      delaySeconds: p.delaySeconds,
      minutesUntil: Math.max(0, Math.round((ms - nowMs) / 60_000)),
    };

    const existing = byTrip.get(p.tripId);
    if (!existing) {
      byTrip.set(p.tripId, row);
      continue;
    }
    const existingMs = pickBestTime(existing.arrivalTime, existing.departureTime).ms;
    if (existingMs === null || ms < existingMs) {
      byTrip.set(p.tripId, row);
    }
  }

  return [...byTrip.values()]
    .sort((a, b) => (a.minutesUntil ?? 9999) - (b.minutesUntil ?? 9999))
    .slice(0, limit);
}

/** Alerts that apply to a route (explicit route id or agency-wide when no routes listed). */
export function filterAlertsForRoute(alerts: ServiceAlert[], routeId: string): ServiceAlert[] {
  return alerts.filter((a) => a.routeIds.length === 0 || a.routeIds.includes(routeId));
}
