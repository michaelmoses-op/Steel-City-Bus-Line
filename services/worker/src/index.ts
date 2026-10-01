import { TRANSIT_CORE_VERSION } from "@steel-city/transit-core";

const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 30_000);

console.log(`[worker] started (transit-core ${TRANSIT_CORE_VERSION}, poll every ${intervalMs}ms)`);
console.log("[worker] GTFS-RT ingest stub — Phase 3 will poll PRT feeds here");

function pollStub(): void {
  console.log(`[worker] poll stub ${new Date().toISOString()}`);
}

pollStub();
setInterval(pollStub, intervalMs);
