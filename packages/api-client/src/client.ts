import {
  healthResponseSchema,
  routeDetailSchema,
  routesListResponseSchema,
  nearbyStopsResponseSchema,
  type HealthResponse,
  type RouteDetail,
  type RouteSummary,
  type NearbyStop,
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
  };
}
