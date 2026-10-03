import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const gtfsDir = path.join(root, "infra", "otp", "gtfs");
const outFile = path.join(gtfsDir, "gtfs.zip");

const url =
  process.env.PRT_GTFS_URL ?? "https://www.rideprt.org/developerresources/GTFS.zip";

fs.mkdirSync(gtfsDir, { recursive: true });

console.log(`[otp] downloading ${url}`);
const res = await fetch(url);
if (!res.ok) {
  console.error(`[otp] download failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(outFile, buf);
console.log(`[otp] wrote ${outFile} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
