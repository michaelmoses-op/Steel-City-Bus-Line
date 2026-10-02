import { pollRealtimeFeeds, writeSnapshot, getRedis } from "@steel-city/transit-core";

export function startRealtimePolling(): void {
  const intervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 15_000);
  const vehiclesUrl = process.env.PRT_GTFSRT_VEHICLES_URL;
  const alertsUrl = process.env.PRT_GTFSRT_ALERTS_URL;
  const tripsUrl = process.env.PRT_GTFSRT_TRIPS_URL;

  if (!process.env.REDIS_URL) {
    console.warn("[worker] REDIS_URL not set — skipping GTFS-RT polling");
    return;
  }
  if (!vehiclesUrl || !alertsUrl) {
    console.warn("[worker] GTFS-RT URLs not set — skipping realtime polling");
    return;
  }

  const feedUrls = { vehicles: vehiclesUrl, alerts: alertsUrl, trips: tripsUrl };
  if (!tripsUrl) {
    console.warn("[worker] PRT_GTFSRT_TRIPS_URL not set — stop arrivals will be empty");
  }

  async function poll(): Promise<void> {
    try {
      const redis = await getRedis();
      const snapshot = await pollRealtimeFeeds(feedUrls);
      await writeSnapshot(redis, snapshot);
      console.log(
        `[worker] rt snapshot: ${snapshot.vehicles.length} vehicles, ${snapshot.tripPredictions.length} trip updates, ${snapshot.alerts.length} alerts`,
      );
    } catch (err) {
      console.error("[worker] rt poll failed", err);
    }
  }

  console.log(`[worker] GTFS-RT polling every ${intervalMs}ms`);
  void poll();
  setInterval(() => void poll(), intervalMs);
}
