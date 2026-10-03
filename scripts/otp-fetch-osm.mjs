import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const osmDir = path.join(root, "infra", "otp", "osm");
const outFile = path.join(osmDir, "pennsylvania-latest.osm.pbf");

const url =
  process.env.OTP_OSM_URL ??
  "https://download.geofabrik.de/north-america/us/pennsylvania-latest.osm.pbf";

if (fs.existsSync(outFile)) {
  const mb = fs.statSync(outFile).size / 1024 / 1024;
  console.log(`[otp] OSM already present (${mb.toFixed(1)} MB): ${outFile}`);
  process.exit(0);
}

fs.mkdirSync(osmDir, { recursive: true });

console.log(`[otp] downloading Pennsylvania OSM (~300MB). This is a one-time download.`);
console.log(`[otp] ${url}`);

const res = await fetch(url);
if (!res.ok) {
  console.error(`[otp] download failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(outFile, buf);
console.log(`[otp] wrote ${outFile} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
console.log("[otp] next: pnpm otp:clip-osm");
