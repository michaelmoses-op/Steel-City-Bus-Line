import { healthResponseSchema, type HealthResponse } from "@steel-city/shared";

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
  };
}
