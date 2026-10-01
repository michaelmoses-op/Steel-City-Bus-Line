import type { LiveVehicle } from "./types.js";

/** Drop stale vehicles from the default map/API list; keep in raw ingest for debugging if needed. */
export function filterDisplayVehicles(vehicles: LiveVehicle[]): LiveVehicle[] {
  return vehicles.filter((v) => !v.stale);
}

export function countStale(vehicles: LiveVehicle[]): number {
  return vehicles.filter((v) => v.stale).length;
}
