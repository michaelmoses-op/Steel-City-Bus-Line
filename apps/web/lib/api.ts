import { createApiClient, type ApiClient } from "@steel-city/api-client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

let serverClient: ApiClient | null = null;

/**
 * Browser calls the Hono API directly (with dev CORS). Server components use the same URL.
 * Avoids Next.js rewrite proxy — it breaks SSE live vehicle streams.
 */
export function getApi(): ApiClient {
  if (typeof window !== "undefined") {
    return createApiClient({ baseUrl: apiBaseUrl });
  }
  if (!serverClient) {
    serverClient = createApiClient({ baseUrl: apiBaseUrl });
  }
  return serverClient;
}
