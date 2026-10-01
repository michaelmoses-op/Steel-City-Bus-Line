/**
 * Domain layer: GTFS import, static schedule, GTFS-RT merge, staleness rules.
 * No HTTP — used by services/api and services/worker only.
 */
export { TRANSIT_CORE_VERSION } from "./version.js";
export { parseGtfsCsv, type GtfsRow } from "./gtfs/parse.js";
export type { GtfsStaticTables } from "./gtfs/import-types.js";
export { importGtfsTables, type ImportGtfsResult } from "./gtfs/import-to-db.js";
export {
  findNearbyStops,
  getRouteDetail,
  listRoutes,
  type NearbyStop,
  type RouteDetail,
  type RouteSummary,
  type StopOnRoute,
} from "./queries/static-data.js";
