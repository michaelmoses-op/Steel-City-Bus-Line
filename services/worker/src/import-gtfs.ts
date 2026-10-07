import "./load-env.js";

import AdmZip from "adm-zip";
import { createDbConnection } from "@steel-city/db";
import {
  importGtfsTables,
  parseGtfsCsv,
  resolvePrtGtfsUrl,
  type GtfsStaticTables,
} from "@steel-city/transit-core";

function readGtfsFromZip(buffer: Buffer): GtfsStaticTables {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const findEntry = (name: string) =>
    entries.find((e) => e.entryName.toLowerCase().endsWith(name.toLowerCase()));

  const readRows = (name: string) => {
    const entry = findEntry(name);
    if (!entry) {
      console.warn(`[import-gtfs] missing ${name}, using empty`);
      return [];
    }
    return parseGtfsCsv(entry.getData().toString("utf8"));
  };

  return {
    routes: readRows("routes.txt"),
    stops: readRows("stops.txt"),
    trips: readRows("trips.txt"),
    stopTimes: readRows("stop_times.txt"),
    shapes: readRows("shapes.txt"),
  };
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const url = await resolvePrtGtfsUrl(process.env.PRT_GTFS_URL);
  console.log(`[import-gtfs] downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GTFS download failed: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`[import-gtfs] downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MiB`);

  console.log("[import-gtfs] parsing zip (large feeds can take a minute)…");
  const tables = readGtfsFromZip(buffer);
  console.log(`[import-gtfs] routes: ${tables.routes.length} rows`);
  console.log(`[import-gtfs] stops: ${tables.stops.length} rows`);
  console.log(`[import-gtfs] trips: ${tables.trips.length} rows`);
  console.log(`[import-gtfs] stop_times: ${tables.stopTimes.length} rows`);
  console.log(`[import-gtfs] shapes: ${tables.shapes.length} rows`);

  const connection = createDbConnection(databaseUrl);
  try {
    console.log("[import-gtfs] importing into postgres (often 5–15 min, progress below)…");
    const result = await importGtfsTables(connection.db, tables);
    console.log("[import-gtfs] done", result);
  } finally {
    await connection.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
