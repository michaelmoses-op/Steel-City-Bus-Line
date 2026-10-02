import {
  decodeAlerts,
  decodeTripUpdates,
  decodeVehiclePositions,
  fetchGtfsRtBuffer,
} from "./decode.js";
import { filterDisplayVehicles } from "./quality.js";
import type { RealtimeSnapshot } from "./types.js";

export type RtFeedUrls = {
  vehicles: string;
  alerts: string;
  trips?: string;
};

export async function pollRealtimeFeeds(urls: RtFeedUrls): Promise<RealtimeSnapshot> {
  const [vehicleBuf, alertBuf, tripBuf] = await Promise.all([
    fetchGtfsRtBuffer(urls.vehicles),
    fetchGtfsRtBuffer(urls.alerts).catch(() => null),
    urls.trips ? fetchGtfsRtBuffer(urls.trips).catch(() => null) : Promise.resolve(null),
  ]);

  const allVehicles = decodeVehiclePositions(vehicleBuf);
  const vehicles = filterDisplayVehicles(allVehicles);
  const alerts = alertBuf ? decodeAlerts(alertBuf) : [];
  const tripPredictions = tripBuf ? decodeTripUpdates(tripBuf) : [];

  return {
    vehicles,
    alerts,
    tripPredictions,
    fetchedAt: new Date().toISOString(),
  };
}
