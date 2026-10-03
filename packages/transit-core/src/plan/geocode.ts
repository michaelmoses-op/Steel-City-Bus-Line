export type GeocodeHit = {
  displayName: string;
  lat: number;
  lon: number;
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = process.env.GEOCODE_USER_AGENT ?? "SteelCityBusLine/1.0 (local dev)";

/** Pittsburgh metro bias for search results. */
const VIEWBOX = "-80.35,40.15,-79.55,40.65";

export async function geocodePlace(query: string, limit = 6): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: String(limit),
    countrycodes: "us",
    viewbox: VIEWBOX,
    bounded: "1",
  });

  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Geocode failed: ${res.status}`);
  }

  const data = (await res.json()) as { display_name?: string; lat?: string; lon?: string }[];
  return data
    .map((row) => {
      const lat = Number(row.lat);
      const lon = Number(row.lon);
      if (!row.display_name || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { displayName: row.display_name, lat, lon };
    })
    .filter((h): h is GeocodeHit => h !== null);
}
