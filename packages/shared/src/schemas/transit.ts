import { z } from "zod";

export const routeSummarySchema = z.object({
  routeId: z.string(),
  routeShortName: z.string().nullable(),
  routeLongName: z.string().nullable(),
  routeType: z.number().int(),
  routeColor: z.string().nullable(),
  routeTextColor: z.string().nullable(),
});

export const stopOnRouteSchema = z.object({
  stopId: z.string(),
  stopName: z.string(),
  lat: z.number(),
  lon: z.number(),
  stopSequence: z.number().int(),
});

export const routeDetailSchema = routeSummarySchema.extend({
  stops: z.array(stopOnRouteSchema),
  shape: z.array(z.object({ lat: z.number(), lon: z.number() })).nullable(),
});

export const routesListResponseSchema = z.object({
  routes: z.array(routeSummarySchema),
});

export const nearbyStopSchema = z.object({
  stopId: z.string(),
  stopName: z.string(),
  lat: z.number(),
  lon: z.number(),
  distanceM: z.number().int(),
});

export const nearbyStopsResponseSchema = z.object({
  stops: z.array(nearbyStopSchema),
});

export type RouteSummary = z.infer<typeof routeSummarySchema>;
export type RouteDetail = z.infer<typeof routeDetailSchema>;
export type NearbyStop = z.infer<typeof nearbyStopSchema>;
