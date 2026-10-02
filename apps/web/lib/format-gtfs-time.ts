/** GTFS times can exceed 24:00 for next-day service. */
export function formatGtfsTime(value: string | null): string {
  if (!value) return "—";
  const parts = value.split(":");
  if (parts.length < 2) return value;
  const hours = Number.parseInt(parts[0] ?? "0", 10);
  const minutes = parts[1];
  const h = hours % 24;
  const suffix = hours >= 24 ? " (+1d)" : "";
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:${minutes} ${ampm}${suffix}`;
}
