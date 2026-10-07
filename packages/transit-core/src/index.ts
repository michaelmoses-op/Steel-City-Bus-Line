/**
 * Domain layer: GTFS import, static schedule, GTFS-RT merge, staleness rules.
 * No HTTP — used by services/api and services/worker only.
 */
export { TRANSIT_CORE_VERSION } from "./version.js";
export { parseGtfsCsv, type GtfsRow } from "./gtfs/parse.js";
export {
  PRT_GTFS_DEFAULT_URL,
  PRT_GTFS_DEV_PAGE,
  PRT_GTFS_LEGACY_URL,
  discoverPrtGtfsUrlFromDevPage,
  resolvePrtGtfsUrl,
} from "./gtfs/prt-gtfs-url.js";
export type { GtfsStaticTables } from "./gtfs/import-types.js";
export { importGtfsTables, type ImportGtfsResult } from "./gtfs/import-to-db.js";
export {
  findNearbyStops,
  getRouteDetail,
  getStopDetail,
  listRoutes,
  listRouteMapShapes,
  type NearbyStop,
  type RouteDetail,
  type RouteMapShape,
  type RouteSummary,
  type StopDetail,
  type StopOnRoute,
} from "./queries/static-data.js";
export {
  decodeAlerts,
  decodeTripUpdates,
  decodeVehiclePositions,
  fetchGtfsRtBuffer,
} from "./realtime/decode.js";
export {
  filterAlertsForRoute,
  getArrivalsForStop,
  type StopArrivalRow,
} from "./realtime/arrivals.js";
export { geocodePlace, type GeocodeHit } from "./plan/geocode.js";
export {
  planTripWithOtp,
  type NormalizedItinerary,
  type NormalizedLeg,
  type PlanOptimize,
  type PlanTimeMode,
  type PlanTripInput,
} from "./plan/otp-plan.js";
export { filterDisplayVehicles, countStale } from "./realtime/quality.js";
export { pollRealtimeFeeds, type RtFeedUrls } from "./realtime/poll.js";
export { readSnapshot, writeSnapshot, type RedisLike } from "./realtime/snapshot-store.js";
export { closeRedis, getRedis } from "./realtime/redis-client.js";
export type {
  LiveVehicle,
  RealtimeSnapshot,
  ServiceAlert,
  TripStopPrediction,
} from "./realtime/types.js";
