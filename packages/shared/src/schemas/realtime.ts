import { z } from "zod";

export const liveVehicleSchema = z.object({
  id: z.string(),
  routeId: z.string().nullable(),
  tripId: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
  bearing: z.number().nullable(),
  speedMps: z.number().nullable(),
  label: z.string().nullable(),
  updatedAt: z.string(),
  stale: z.boolean(),
});

export const vehiclesResponseSchema = z.object({
  vehicles: z.array(liveVehicleSchema),
  fetchedAt: z.string().nullable(),
});

export const serviceAlertSchema = z.object({
  id: z.string(),
  headerText: z.string().nullable(),
  descriptionText: z.string().nullable(),
  severity: z.string().nullable(),
  routeIds: z.array(z.string()),
  activePeriods: z.array(
    z.object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    }),
  ),
});

export const alertsResponseSchema = z.object({
  alerts: z.array(serviceAlertSchema),
  fetchedAt: z.string().nullable(),
});

export const stopArrivalSchema = z.object({
  tripId: z.string(),
  routeId: z.string().nullable(),
  routeShortName: z.string().nullable(),
  routeLongName: z.string().nullable(),
  routeColor: z.string().nullable(),
  routeTextColor: z.string().nullable(),
  arrivalTime: z.string().nullable(),
  departureTime: z.string().nullable(),
  delaySeconds: z.number().nullable(),
  minutesUntil: z.number().nullable(),
});

export const stopArrivalsResponseSchema = z.object({
  stopId: z.string(),
  arrivals: z.array(stopArrivalSchema),
  fetchedAt: z.string().nullable(),
});

export const stopDetailSchema = z.object({
  stopId: z.string(),
  stopName: z.string(),
  lat: z.number(),
  lon: z.number(),
  routes: z.array(
    z.object({
      routeId: z.string(),
      routeShortName: z.string().nullable(),
      routeLongName: z.string().nullable(),
      routeColor: z.string().nullable(),
      routeTextColor: z.string().nullable(),
    }),
  ),
});

export type LiveVehicle = z.infer<typeof liveVehicleSchema>;
export type ServiceAlert = z.infer<typeof serviceAlertSchema>;
export type StopArrival = z.infer<typeof stopArrivalSchema>;
export type StopDetail = z.infer<typeof stopDetailSchema>;
