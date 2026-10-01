import { decodeAlerts, decodeVehiclePositions, fetchGtfsRtBuffer } from "./decode.js";
import { filterDisplayVehicles } from "./quality.js";
import type { RealtimeSnapshot } from "./types.js";

export type RtFeedUrls = {
  vehicles: string;
  alerts: string;
};

export async function pollRealtimeFeeds(urls: RtFeedUrls): Promise<RealtimeSnapshot> {
  const [vehicleBuf, alertBuf] = await Promise.all([
    fetchGtfsRtBuffer(urls.vehicles),
    fetchGtfsRtBuffer(urls.alerts).catch(() => null),
  ]);

  const allVehicles = decodeVehiclePositions(vehicleBuf);
  const vehicles = filterDisplayVehicles(allVehicles);
  const alerts = alertBuf ? decodeAlerts(alertBuf) : [];

  return {
    vehicles,
    alerts,
    fetchedAt: new Date().toISOString(),
  };
}
