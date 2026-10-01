import {
  alertsResponseSchema,
  healthResponseSchema,
  nearbyStopsResponseSchema,
  routeDetailSchema,
  routesListResponseSchema,
  stopDetailSchema,
  vehiclesResponseSchema,
  type HealthResponse,
  type LiveVehicle,
  type NearbyStop,
  type RouteDetail,
  type RouteSummary,
  type ServiceAlert,
  type StopDetail,
} from "@steel-city/shared";

export type ApiClientOptions = {
  baseUrl: string;
  fetch?: typeof fetch;
};

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(options: ApiClientOptions) {
  const { baseUrl, fetch: fetchFn = fetch } = options;
  const base = baseUrl.replace(/\/$/, "");

  async function getJson<T>(path: string, schema: { parse: (data: unknown) => T }): Promise<T> {
    const res = await fetchFn(`${base}${path}`);
    if (!res.ok) {
      throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
    }
    const data: unknown = await res.json();
    return schema.parse(data);
  }

  return {
    getHealth(): Promise<HealthResponse> {
      return getJson("/api/v1/health", healthResponseSchema);
    },

    getRoutes(): Promise<RouteSummary[]> {
      return getJson("/api/v1/routes", routesListResponseSchema).then((r) => r.routes);
    },

    getRoute(routeId: string): Promise<RouteDetail> {
      return getJson(`/api/v1/routes/${encodeURIComponent(routeId)}`, routeDetailSchema);
    },

    getNearbyStops(lat: number, lon: number, radiusM = 500): Promise<NearbyStop[]> {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        radius: String(radiusM),
      });
      return getJson(`/api/v1/stops/nearby?${params}`, nearbyStopsResponseSchema).then(
        (r) => r.stops,
      );
    },

    getStop(stopId: string): Promise<StopDetail> {
      return getJson(`/api/v1/stops/${encodeURIComponent(stopId)}`, stopDetailSchema);
    },

    getVehicles(routeId?: string): Promise<{ vehicles: LiveVehicle[]; fetchedAt: string | null }> {
      const q = routeId ? `?routeId=${encodeURIComponent(routeId)}` : "";
      return getJson(`/api/v1/vehicles${q}`, vehiclesResponseSchema);
    },

    getAlerts(): Promise<{ alerts: ServiceAlert[]; fetchedAt: string | null }> {
      return getJson("/api/v1/alerts", alertsResponseSchema);
    },

    subscribeVehicles(
      onUpdate: (payload: { vehicles: LiveVehicle[]; fetchedAt: string | null }) => void,
      options?: { routeId?: string; onError?: (err: Error) => void },
    ): () => void {
      const params = new URLSearchParams();
      if (options?.routeId) params.set("routeId", options.routeId);
      const q = params.toString();
      const url = `${base}/api/v1/vehicles/stream${q ? `?${q}` : ""}`;
      const es = new EventSource(url);

      es.addEventListener("vehicles", (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as {
            vehicles: LiveVehicle[];
            fetchedAt: string | null;
          };
          onUpdate(data);
        } catch (err) {
          options?.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      });

      es.onerror = () => {
        options?.onError?.(new Error("Vehicle stream disconnected"));
      };

      return () => es.close();
    },
  };
}
