import {
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";

export const routes = pgTable("routes", {
  routeId: text("route_id").primaryKey(),
  routeShortName: text("route_short_name"),
  routeLongName: text("route_long_name"),
  routeType: integer("route_type").notNull(),
  routeColor: text("route_color"),
  routeTextColor: text("route_text_color"),
});

export const stops = pgTable("stops", {
  stopId: text("stop_id").primaryKey(),
  stopName: text("stop_name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
});

export const trips = pgTable("trips", {
  tripId: text("trip_id").primaryKey(),
  routeId: text("route_id")
    .notNull()
    .references(() => routes.routeId, { onDelete: "cascade" }),
  serviceId: text("service_id").notNull(),
  shapeId: text("shape_id"),
  directionId: integer("direction_id"),
  tripHeadsign: text("trip_headsign"),
});

export const stopTimes = pgTable(
  "stop_times",
  {
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.tripId, { onDelete: "cascade" }),
    stopId: text("stop_id")
      .notNull()
      .references(() => stops.stopId, { onDelete: "cascade" }),
    stopSequence: integer("stop_sequence").notNull(),
    arrivalTime: text("arrival_time"),
    departureTime: text("departure_time"),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.stopSequence] })],
);

export const shapePoints = pgTable(
  "shape_points",
  {
    shapeId: text("shape_id").notNull(),
    shapePtSequence: integer("shape_pt_sequence").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
  },
  (table) => [primaryKey({ columns: [table.shapeId, table.shapePtSequence] })],
);
