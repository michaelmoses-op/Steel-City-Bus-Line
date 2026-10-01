export type LiveVehicle = {
  id: string;
  routeId: string | null;
  tripId: string | null;
  lat: number;
  lon: number;
  bearing: number | null;
  speedMps: number | null;
  label: string | null;
  updatedAt: string;
  stale: boolean;
};

export type ServiceAlert = {
  id: string;
  headerText: string | null;
  descriptionText: string | null;
  severity: string | null;
  routeIds: string[];
  activePeriods: { start: string | null; end: string | null }[];
};

export type RealtimeSnapshot = {
  vehicles: LiveVehicle[];
  alerts: ServiceAlert[];
  fetchedAt: string;
};
