import type { LiveVehicle } from "./types.js";

/** Vehicles shown on the map/API: fresh GPS and an assigned route. */
export function filterDisplayVehicles(vehicles: LiveVehicle[]): LiveVehicle[] {
  return vehicles.filter((v) => !v.stale && v.routeId !== null && v.routeId !== "");
}

export function countStale(vehicles: LiveVehicle[]): number {
  return vehicles.filter((v) => v.stale).length;
}
