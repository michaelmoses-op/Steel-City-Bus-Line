export type LatLon = { lat: number; lon: number };

/** Google-encoded polyline (OTP legGeometry.points, precision 5). */
export function decodePolyline(encoded: string, precision = 5): LatLon[] {
  if (!encoded) return [];

  const factor = 10 ** precision;
  let index = 0;
  let lat = 0;
  let lon = 0;
  const out: LatLon[] = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLon = result & 1 ? ~(result >> 1) : result >> 1;
    lon += deltaLon;

    out.push({ lat: lat / factor, lon: lon / factor });
  }

  return out;
}
