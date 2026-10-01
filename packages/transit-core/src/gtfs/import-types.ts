import type { GtfsRow } from "./parse.js";

export type GtfsStaticTables = {
  routes: GtfsRow[];
  stops: GtfsRow[];
  trips: GtfsRow[];
  stopTimes: GtfsRow[];
  shapes: GtfsRow[];
};

export type NormalizedRoute = {
  routeId: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeType: number;
  routeColor: string | null;
  routeTextColor: string | null;
};

export type NormalizedStop = {
  stopId: string;
  stopName: string;
  lat: number;
  lon: number;
};

export type NormalizedTrip = {
  tripId: string;
  routeId: string;
  serviceId: string;
  shapeId: string | null;
  directionId: number | null;
  tripHeadsign: string | null;
};

export type NormalizedStopTime = {
  tripId: string;
  stopId: string;
  stopSequence: number;
  arrivalTime: string | null;
  departureTime: string | null;
};

export type NormalizedShapePoint = {
  shapeId: string;
  shapePtSequence: number;
  lat: number;
  lon: number;
};
