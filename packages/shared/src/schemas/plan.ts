import { z } from "zod";

export const geocodeResultSchema = z.object({
  displayName: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export const geocodeResponseSchema = z.object({
  results: z.array(geocodeResultSchema),
});

export const planMapPointSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const tripLegSchema = z.object({
  mode: z.enum(["WALK", "TRANSIT", "OTHER"]),
  routeShortName: z.string().nullable(),
  routeId: z.string().nullable(),
  routeColor: z.string().nullable(),
  routeTextColor: z.string().nullable().optional().transform((v) => v ?? null),
  headsign: z.string().nullable(),
  fromName: z.string(),
  toName: z.string(),
  fromLat: z.number().nullable().optional().transform((v) => v ?? null),
  fromLon: z.number().nullable().optional().transform((v) => v ?? null),
  toLat: z.number().nullable().optional().transform((v) => v ?? null),
  toLon: z.number().nullable().optional().transform((v) => v ?? null),
  geometry: z.array(planMapPointSchema).optional().default([]),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  durationSec: z.number().int(),
  distanceM: z.number().nullable(),
});

export const tripItinerarySchema = z.object({
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  durationSec: z.number().int(),
  transfers: z.number().int(),
  walkDistanceM: z.number().nullable(),
  legs: z.array(tripLegSchema),
});

export const tripPlanResponseSchema = z.object({
  from: z.object({ lat: z.number(), lon: z.number(), label: z.string().nullable() }),
  to: z.object({ lat: z.number(), lon: z.number(), label: z.string().nullable() }),
  itineraries: z.array(tripItinerarySchema),
  plannerNote: z.string().nullable(),
});

export type GeocodeResult = z.infer<typeof geocodeResultSchema>;
export type TripLeg = z.infer<typeof tripLegSchema>;
export type TripItinerary = z.infer<typeof tripItinerarySchema>;
export type TripPlanResponse = z.infer<typeof tripPlanResponseSchema>;
