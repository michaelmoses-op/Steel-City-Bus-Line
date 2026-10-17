/** Browser-safe flag; set `NEXT_PUBLIC_ENABLE_TRIP_PLANNER=true` locally to show Plan trip. */
export function isTripPlannerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_TRIP_PLANNER === "true";
}
