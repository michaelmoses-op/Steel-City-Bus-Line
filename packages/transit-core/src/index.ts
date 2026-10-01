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
  getStopDetail,
  listRoutes,
  type NearbyStop,
  type RouteDetail,
  type RouteSummary,
  type StopDetail,
  type StopOnRoute,
} from "./queries/static-data.js";
export {
  decodeAlerts,
  decodeVehiclePositions,
  fetchGtfsRtBuffer,
} from "./realtime/decode.js";
export { filterDisplayVehicles, countStale } from "./realtime/quality.js";
export { pollRealtimeFeeds, type RtFeedUrls } from "./realtime/poll.js";
export { readSnapshot, writeSnapshot, type RedisLike } from "./realtime/snapshot-store.js";
export { closeRedis, getRedis } from "./realtime/redis-client.js";
export type { LiveVehicle, RealtimeSnapshot, ServiceAlert } from "./realtime/types.js";
