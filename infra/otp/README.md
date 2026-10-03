# OpenTripPlanner (local trip planning)

PRT static GTFS is downloaded to `gtfs/gtfs.zip` (gitignored). The built graph is stored here after `pnpm otp:build`.

`otp-config.json` enables the legacy REST `/plan` API (required for OTP 2.7+).

`build-config.json` uses **clipped Pittsburgh OSM** (`osm/pittsburgh.osm.pbf` from `pnpm otp:clip-osm`). Full-state OSM OOMs on a 2GB JVM.

Clipping uses Docker image `iboates/osmium:latest` (override with `OTP_OSMIUM_IMAGE`).

Do not commit `gtfs/`, `osm/`, `graph.obj`, or `stops-index.json`.
