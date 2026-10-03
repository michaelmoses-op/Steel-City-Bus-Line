"use client";

import type { GeocodeResult, TripItinerary } from "@steel-city/shared";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { PlanOptionGroup, PlanToggle } from "@/components/plan-option-group";
import { PlaceSearchField } from "@/components/place-search-field";
import { getApi } from "@/lib/api";
import { getRouteBadgeStyle } from "@/lib/route-badge-style";

const PlanTripMap = dynamic(
  () => import("@/components/plan-trip-map").then((m) => m.PlanTripMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[min(55vh,440px)] w-full animate-pulse rounded-xl border border-zinc-800 bg-zinc-900"
        aria-hidden
      />
    ),
  },
);

type TimeMode = "leave_now" | "depart_at" | "arrive_by";
type Optimize = "best" | "fewest_transfers";

function formatDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h} hr ${rem} min` : `${h} hr`;
}

function formatClock(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function ItineraryCard({
  it,
  index,
  selected,
  onSelect,
}: {
  it: TripItinerary;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`pgh-steel-panel w-full cursor-pointer rounded-xl p-4 text-left transition ${
          selected
            ? "border-2 border-[#FFB612] shadow-[0_0_0_1px_#FFB612]"
            : "hover:border-zinc-500"
        }`}
      >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-zinc-100">Option {index + 1}</h3>
        <span className="text-sm text-zinc-400">
          {formatClock(it.startTime)} → {formatClock(it.endTime)} · {formatDuration(it.durationSec)}
          {it.transfers > 0 && ` · ${it.transfers} transfer${it.transfers === 1 ? "" : "s"}`}
        </span>
      </div>
      <ol className="mt-4 space-y-3">
        {it.legs.map((leg, i) => (
          <li key={`${leg.fromName}-${leg.toName}-${i}`} className="flex gap-3 text-sm">
            <span
              className={`mt-0.5 min-w-[2.75rem] shrink-0 rounded px-2 py-0.5 text-center text-xs font-bold ${
                leg.mode === "WALK" ? "bg-zinc-800 text-zinc-300" : ""
              }`}
              style={
                leg.mode === "TRANSIT"
                  ? getRouteBadgeStyle(leg.routeColor, leg.routeTextColor)
                  : undefined
              }
            >
              {leg.mode === "WALK" ? "Walk" : (leg.routeShortName ?? "Bus")}
            </span>
            <div className="min-w-0 text-zinc-300">
              <p>
                {leg.fromName} → {leg.toName}
              </p>
              {leg.headsign && <p className="text-xs text-zinc-500">Toward {leg.headsign}</p>}
              <p className="text-xs text-zinc-500">
                {formatDuration(leg.durationSec)}
                {leg.distanceM != null && leg.mode === "WALK"
                  ? ` · ${Math.round(leg.distanceM)} m`
                  : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
      </button>
    </li>
  );
}

export default function PlanTripPage() {
  const [from, setFrom] = useState<GeocodeResult | null>(null);
  const [to, setTo] = useState<GeocodeResult | null>(null);
  const [timeMode, setTimeMode] = useState<TimeMode>("leave_now");
  const [dateTime, setDateTime] = useState("");
  const [optimize, setOptimize] = useState<Optimize>("best");
  const [preferShorterWalks, setPreferShorterWalks] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itineraries, setItineraries] = useState<TripItinerary[]>([]);
  const [plannerNote, setPlannerNote] = useState<string | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState(0);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setFrom({
        displayName: "My location",
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      });
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      setError("Choose a from and to location from the suggestions.");
      return;
    }
    if (timeMode !== "leave_now" && !dateTime) {
      setError("Pick a date and time.");
      return;
    }

    setLoading(true);
    setError(null);
    setItineraries([]);
    setPlannerNote(null);
    setSelectedItinerary(0);

    try {
      const result = await getApi().planTrip({
        fromLat: from.lat,
        fromLon: from.lon,
        toLat: to.lat,
        toLon: to.lon,
        timeMode,
        dateTime: timeMode === "leave_now" ? undefined : new Date(dateTime).toISOString(),
        optimize,
        walkPreference: preferShorterWalks ? "less" : "default",
        fromLabel: from.displayName,
        toLabel: to.displayName,
      });
      setItineraries(result.itineraries);
      setPlannerNote(result.plannerNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not plan trip");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-50">Plan trip</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Enter where you&apos;re leaving from and where you&apos;re going. We&apos;ll suggest transit
          and walking legs using the regional schedule.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="pgh-steel-panel space-y-4 rounded-xl p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <PlaceSearchField
              label="From"
              value={from}
              onChange={setFrom}
              placeholder="Address or place in Pittsburgh area"
            />
            <PlaceSearchField
              label="To"
              value={to}
              onChange={setTo}
              placeholder="Destination"
            />
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            className="text-sm font-medium text-[#FFB612] hover:underline"
          >
            Use my location for From
          </button>
        </div>

        <div className="pgh-steel-panel space-y-5 rounded-xl p-5">
          <PlanOptionGroup
            legend="When"
            name="timeMode"
            value={timeMode}
            onChange={setTimeMode}
            options={[
              { id: "leave_now", label: "Leave now" },
              { id: "depart_at", label: "Depart at" },
              { id: "arrive_by", label: "Arrive by" },
            ]}
          />
          {timeMode !== "leave_now" && (
            <div>
              <label htmlFor="plan-datetime" className="mb-1 block text-xs font-medium text-zinc-500">
                Date &amp; time
              </label>
              <input
                id="plan-datetime"
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          )}

          <div className="border-t border-zinc-700/80 pt-5">
            <PlanOptionGroup
              legend="Prefer"
              name="optimize"
              value={optimize}
              onChange={setOptimize}
              options={[
                { id: "best", label: "Best route" },
                { id: "fewest_transfers", label: "Fewest transfers" },
              ]}
            />
          </div>

          <div className="border-t border-zinc-700/80 pt-5">
            <PlanToggle
              label="Prefer shorter walks"
              description="Limits long walks to stops (~1 km) and ranks options with less walking first."
              checked={preferShorterWalks}
              onChange={setPreferShorterWalks}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="pgh-btn-primary rounded-lg px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {loading ? "Planning…" : "Find routes"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-100">
          {error}
          {error.includes("503") || error.toLowerCase().includes("not configured") ? (
            <>
              {" "}
              Trip planning needs OpenTripPlanner — see{" "}
              <Link href="/" className="text-[#FFB612] hover:underline">
                README
              </Link>{" "}
              for setup.
            </>
          ) : null}
        </p>
      )}

      {plannerNote && itineraries.length === 0 && (
        <p className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-400">
          {plannerNote}
        </p>
      )}

      {from && to && (
        <section aria-label="Trip map">
          <h2 className="mb-2 text-lg font-medium text-zinc-100">Map</h2>
          <PlanTripMap
            from={{ lat: from.lat, lon: from.lon, label: from.displayName }}
            to={{ lat: to.lat, lon: to.lon, label: to.displayName }}
            itinerary={itineraries[selectedItinerary] ?? null}
          />
        </section>
      )}

      {itineraries.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-medium text-zinc-100">Itineraries</h2>
          <p className="mb-3 text-sm text-zinc-500">
            Tap an option to update the route on the map above.
          </p>
          <ul className="space-y-4">
            {itineraries.map((it, i) => (
              <ItineraryCard
                key={`${it.startTime}-${i}`}
                it={it}
                index={i}
                selected={selectedItinerary === i}
                onSelect={() => setSelectedItinerary(i)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
