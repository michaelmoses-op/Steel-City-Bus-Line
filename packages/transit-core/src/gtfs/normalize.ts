import type {
  NormalizedRoute,
  NormalizedShapePoint,
  NormalizedStop,
  NormalizedStopTime,
  NormalizedTrip,
} from "./import-types.js";
import type { GtfsRow } from "./parse.js";
import {
  optional,
  parseFloatField,
  parseIntField,
  parseOptionalInt,
  required,
} from "./parse.js";

export function normalizeRoute(row: GtfsRow): NormalizedRoute {
  return {
    routeId: required(row, "route_id"),
    routeShortName: optional(row, "route_short_name"),
    routeLongName: optional(row, "route_long_name"),
    routeType: parseIntField(row, "route_type"),
    routeColor: optional(row, "route_color"),
    routeTextColor: optional(row, "route_text_color"),
  };
}

export function normalizeStop(row: GtfsRow): NormalizedStop {
  return {
    stopId: required(row, "stop_id"),
    stopName: required(row, "stop_name"),
    lat: parseFloatField(row, "stop_lat"),
    lon: parseFloatField(row, "stop_lon"),
  };
}

export function normalizeTrip(row: GtfsRow): NormalizedTrip {
  return {
    tripId: required(row, "trip_id"),
    routeId: required(row, "route_id"),
    serviceId: required(row, "service_id"),
    shapeId: optional(row, "shape_id"),
    directionId: parseOptionalInt(row, "direction_id"),
    tripHeadsign: optional(row, "trip_headsign"),
  };
}

export function normalizeStopTime(row: GtfsRow): NormalizedStopTime {
  return {
    tripId: required(row, "trip_id"),
    stopId: required(row, "stop_id"),
    stopSequence: parseIntField(row, "stop_sequence"),
    arrivalTime: optional(row, "arrival_time"),
    departureTime: optional(row, "departure_time"),
  };
}

export function normalizeShapePoint(row: GtfsRow): NormalizedShapePoint {
  return {
    shapeId: required(row, "shape_id"),
    shapePtSequence: parseIntField(row, "shape_pt_sequence"),
    lat: parseFloatField(row, "shape_pt_lat"),
    lon: parseFloatField(row, "shape_pt_lon"),
  };
}
