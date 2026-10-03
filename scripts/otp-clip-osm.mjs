import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const osmDir = path.join(root, "infra", "otp", "osm");
const source = path.join(osmDir, "pennsylvania-latest.osm.pbf");
const clipped = path.join(osmDir, "pittsburgh.osm.pbf");

/** Greater Pittsburgh + Allegheny County fringe (minLon,minLat,maxLon,maxLat). */
const BBOX = process.env.OTP_OSM_BBOX ?? "-80.35,40.08,-79.55,40.62";

if (!fs.existsSync(source)) {
  console.error("[otp] Missing pennsylvania-latest.osm.pbf — run pnpm otp:fetch-osm first.");
  process.exit(1);
}

if (fs.existsSync(clipped)) {
  const srcMtime = fs.statSync(source).mtimeMs;
  const clipMtime = fs.statSync(clipped).mtimeMs;
  if (clipMtime >= srcMtime) {
    console.log(`[otp] Clipped OSM already up to date: ${clipped}`);
    process.exit(0);
  }
}

const osmDirPosix = osmDir.replace(/\\/g, "/");
const dockerSource = `/data/pennsylvania-latest.osm.pbf`;
const dockerOut = `/data/pittsburgh.osm.pbf`;

/** Docker Hub; ghcr.io/osmcode/osmium-tool often returns "denied" without GHCR login. */
const OSMIUM_IMAGE = process.env.OTP_OSMIUM_IMAGE ?? "iboates/osmium:latest";

console.log(`[otp] clipping OSM to bbox ${BBOX} (image: ${OSMIUM_IMAGE})...`);

const result = spawnSync(
  "docker",
  [
    "run",
    "--rm",
    "-v",
    `${osmDirPosix}:/data`,
    OSMIUM_IMAGE,
    "extract",
    "--bbox",
    BBOX,
    dockerSource,
    "-o",
    dockerOut,
    "--overwrite",
  ],
  { stdio: "inherit", shell: false },
);

if (result.status !== 0) {
  console.error(
    `[otp] osmium extract failed (image ${OSMIUM_IMAGE}). Is Docker running? Try OTP_OSMIUM_IMAGE=iboates/osmium:latest`,
  );
  process.exit(result.status ?? 1);
}

const mb = fs.statSync(clipped).size / 1024 / 1024;
console.log(`[otp] wrote ${clipped} (${mb.toFixed(1)} MB)`);
