import { decodePolyline } from "./polyline.js";

export type PlanTimeMode = "leave_now" | "depart_at" | "arrive_by";
export type PlanOptimize = "best" | "fewest_transfers";
export type PlanWalkPreference = "default" | "less";

export type PlanTripInput = {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  timeMode: PlanTimeMode;
  /** ISO local datetime string when not leave_now */
  dateTime?: string;
  optimize: PlanOptimize;
  /** Penalize long walks and cap walk leg length when "less". */
  walkPreference?: PlanWalkPreference;
};

export type PlanMapPoint = { lat: number; lon: number };

export type NormalizedLeg = {
  mode: "WALK" | "TRANSIT" | "OTHER";
  routeShortName: string | null;
  routeId: string | null;
  routeColor: string | null;
  routeTextColor: string | null;
  headsign: string | null;
  fromName: string;
  toName: string;
  fromLat: number | null;
  fromLon: number | null;
  toLat: number | null;
  toLon: number | null;
  geometry: PlanMapPoint[];
  startTime: string | null;
  endTime: string | null;
  durationSec: number;
  distanceM: number | null;
};

export type NormalizedItinerary = {
  startTime: string | null;
  endTime: string | null;
  durationSec: number;
  transfers: number;
  walkDistanceM: number | null;
  legs: NormalizedLeg[];
};

type OtpLeg = {
  mode?: string;
  routeShortName?: string;
  route?: string;
  routeId?: string;
  routeColor?: string;
  routeTextColor?: string;
  headsign?: string;
  from?: { name?: string; lat?: number; lon?: number };
  to?: { name?: string; lat?: number; lon?: number };
  legGeometry?: { points?: string };
  startTime?: number;
  endTime?: number;
  duration?: number;
  distance?: number;
};

type OtpPlanResponse = {
  plan?: {
    itineraries?: {
      startTime?: number;
      endTime?: number;
      duration?: number;
      transfers?: number;
      walkDistance?: number;
      legs?: OtpLeg[];
    }[];
  };
  error?: { msg?: string; message?: string };
};

const OTP_TIME_ZONE = "America/New_York";

function itineraryWalkMeters(it: NormalizedItinerary): number {
  if (it.walkDistanceM != null && it.walkDistanceM > 0) return it.walkDistanceM;
  return it.legs
    .filter((l) => l.mode === "WALK")
    .reduce((sum, l) => sum + (l.distanceM ?? 0), 0);
}

function legGeometry(leg: OtpLeg): PlanMapPoint[] {
  const encoded = leg.legGeometry?.points;
  if (encoded) {
    const decoded = decodePolyline(encoded);
    if (decoded.length >= 2) return decoded;
  }
  const from = leg.from;
  const to = leg.to;
  if (
    from?.lat != null &&
    from.lon != null &&
    to?.lat != null &&
    to.lon != null
  ) {
    return [
      { lat: from.lat, lon: from.lon },
      { lat: to.lat, lon: to.lon },
    ];
  }
  return [];
}

function msToIso(ms: number | undefined): string | null {
  if (ms === undefined || !Number.isFinite(ms)) return null;
  if (ms < 0 || ms > 8_640_000_000_000_000) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toISOString();
  } catch {
    return null;
  }
}

/** OTP 2.x legacy /plan uses calendar date + clock time, not epoch ms in `time`. */
function otpLegacyDateAndClock(timeMs: number): { date: string; clock: string } {
  const when = new Date(timeMs);
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: OTP_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const parts = dateFmt.formatToParts(when);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "01";
  const date = `${pick("month")}-${pick("day")}-${pick("year")}`;

  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: OTP_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(when)
    .replace(/\s/g, "");

  return { date, clock };
}

function normalizeMode(mode: string | undefined): NormalizedLeg["mode"] {
  if (!mode) return "OTHER";
  if (mode === "WALK") return "WALK";
  if (mode === "BUS" || mode === "TRAM" || mode === "RAIL" || mode === "SUBWAY" || mode === "TROLLEYBUS") {
    return "TRANSIT";
  }
  return "OTHER";
}

function normalizeLeg(leg: OtpLeg): NormalizedLeg {
  const durationSec = leg.duration ?? 0;
  return {
    mode: normalizeMode(leg.mode),
    routeShortName: leg.routeShortName ?? leg.route ?? null,
    routeId: leg.routeId ?? null,
    routeColor: leg.routeColor ?? null,
    routeTextColor: leg.routeTextColor ?? null,
    headsign: leg.headsign ?? null,
    fromName: leg.from?.name ?? "Start",
    toName: leg.to?.name ?? "End",
    fromLat: leg.from?.lat ?? null,
    fromLon: leg.from?.lon ?? null,
    toLat: leg.to?.lat ?? null,
    toLon: leg.to?.lon ?? null,
    geometry: legGeometry(leg),
    startTime: msToIso(leg.startTime),
    endTime: msToIso(leg.endTime),
    durationSec,
    distanceM: leg.distance ?? null,
  };
}

function resolvePlanTime(input: PlanTripInput): { timeMs: number; arriveBy: boolean } {
  if (input.timeMode === "leave_now") {
    return { timeMs: Date.now(), arriveBy: false };
  }
  const parsed = input.dateTime ? new Date(input.dateTime).getTime() : NaN;
  const timeMs = Number.isFinite(parsed) ? parsed : Date.now();
  return {
    timeMs,
    arriveBy: input.timeMode === "arrive_by",
  };
}

export async function planTripWithOtp(
  baseUrl: string,
  input: PlanTripInput,
): Promise<{ itineraries: NormalizedItinerary[]; plannerNote: string | null }> {
  const root = baseUrl.replace(/\/$/, "");
  const { timeMs, arriveBy } = resolvePlanTime(input);

  const { date, clock } = otpLegacyDateAndClock(timeMs);

  const params = new URLSearchParams({
    fromPlace: `::${input.fromLat},${input.fromLon}`,
    toPlace: `::${input.toLat},${input.toLon}`,
    mode: "WALK,TRANSIT",
    arriveBy: String(arriveBy),
    date,
    time: clock,
    numItineraries: "4",
  });

  if (input.optimize === "fewest_transfers") {
    params.set("transferPenalty", "3600");
    params.set("maxTransfers", "2");
  } else {
    params.set("transferPenalty", "120");
  }

  const preferLessWalk = input.walkPreference !== "default";
  if (preferLessWalk) {
    params.set("walkReluctance", "10");
    params.set("maxWalkDistance", "1000");
    params.set("walkBoardCost", "900");
  }

  const url = `${root}/otp/routers/default/plan?${params}`;
  const res = await fetch(url);
  const body = (await res.json()) as OtpPlanResponse;

  if (!res.ok) {
    const msg = body.error?.msg ?? body.error?.message ?? res.statusText;
    throw new Error(`Trip planner error: ${msg}`);
  }

  const raw = body.plan?.itineraries ?? [];
  const otpErrorMsg = body.error?.msg ?? body.error?.message ?? null;
  let itineraries: NormalizedItinerary[] = raw.map((it) => ({
    startTime: msToIso(it.startTime),
    endTime: msToIso(it.endTime),
    durationSec: it.duration ?? 0,
    transfers: it.transfers ?? 0,
    walkDistanceM: it.walkDistance ?? null,
    legs: (it.legs ?? []).map(normalizeLeg),
  }));

  if (preferLessWalk && itineraries.length > 1) {
    itineraries = [...itineraries].sort(
      (a, b) =>
        itineraryWalkMeters(a) - itineraryWalkMeters(b) ||
        a.durationSec - b.durationSec ||
        a.transfers - b.transfers,
    );
  }

  let plannerNote: string | null = null;
  if (itineraries.length === 0) {
    plannerNote =
      otpErrorMsg ??
      "No transit itineraries found. If you recently set up OTP, rebuild the graph with OSM (pnpm otp:build).";
  }

  return { itineraries, plannerNote };
}
