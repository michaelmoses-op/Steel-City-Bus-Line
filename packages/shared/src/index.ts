export { healthResponseSchema, type HealthResponse } from "./schemas/health.js";
export {
  nearbyStopSchema,
  nearbyStopsResponseSchema,
  routeDetailSchema,
  routeSummarySchema,
  routesListResponseSchema,
  stopOnRouteSchema,
  type NearbyStop,
  type RouteDetail,
  type RouteSummary,
} from "./schemas/transit.js";
export {
  alertsResponseSchema,
  liveVehicleSchema,
  serviceAlertSchema,
  stopDetailSchema,
  vehiclesResponseSchema,
  type LiveVehicle,
  type ServiceAlert,
  type StopDetail,
} from "./schemas/realtime.js";
