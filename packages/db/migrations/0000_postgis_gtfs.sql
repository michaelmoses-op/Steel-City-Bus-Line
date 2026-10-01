CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS routes (
  route_id text PRIMARY KEY,
  route_short_name text,
  route_long_name text,
  route_type integer NOT NULL,
  route_color text,
  route_text_color text
);

CREATE TABLE IF NOT EXISTS stops (
  stop_id text PRIMARY KEY,
  stop_name text NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
  trip_id text PRIMARY KEY,
  route_id text NOT NULL REFERENCES routes (route_id) ON DELETE CASCADE,
  service_id text NOT NULL,
  shape_id text,
  direction_id integer,
  trip_headsign text
);

CREATE TABLE IF NOT EXISTS stop_times (
  trip_id text NOT NULL REFERENCES trips (trip_id) ON DELETE CASCADE,
  stop_id text NOT NULL REFERENCES stops (stop_id) ON DELETE CASCADE,
  stop_sequence integer NOT NULL,
  arrival_time text,
  departure_time text,
  PRIMARY KEY (trip_id, stop_sequence)
);

CREATE TABLE IF NOT EXISTS shape_points (
  shape_id text NOT NULL,
  shape_pt_sequence integer NOT NULL,
  lat double precision NOT NULL,
  lon double precision NOT NULL,
  PRIMARY KEY (shape_id, shape_pt_sequence)
);

CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips (route_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_stop_id ON stop_times (stop_id);
CREATE INDEX IF NOT EXISTS idx_stop_times_trip_id ON stop_times (trip_id);

CREATE INDEX IF NOT EXISTS idx_stops_geog ON stops USING GIST (
  (ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography)
);
