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
  stopArrivalSchema,
  stopArrivalsResponseSchema,
  stopDetailSchema,
  vehiclesResponseSchema,
  type LiveVehicle,
  type ServiceAlert,
  type StopArrival,
  type StopDetail,
} from "./schemas/realtime.js";
