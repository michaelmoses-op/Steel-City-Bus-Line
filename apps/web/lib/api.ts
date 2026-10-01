import { createApiClient } from "@steel-city/api-client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = createApiClient({ baseUrl });
