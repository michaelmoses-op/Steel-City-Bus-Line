import { z } from "zod";

/** Placeholder shared API schema — expand in Phase 2+ for routes, stops, vehicles. */
export const healthResponseSchema = z.object({
  ok: z.literal(true),
  version: z.string(),
  service: z.string().optional(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
