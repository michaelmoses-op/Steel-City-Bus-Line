"use client";

import type { TripItinerary } from "@steel-city/shared";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PITTSBURGH: [number, number] = [-79.9959, 40.4406];
const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

const LEGS_SOURCE_ID = "plan-legs";

type Place = { lat: number; lon: number; label?: string };

type Props = {
  from: Place;
  to: Place;
  itinerary: TripItinerary | null;
  className?: string;
};

function lineColor(routeColor: string | null | undefined): string {
  if (!routeColor) return "#FFB612";
  const hex = routeColor.replace(/^#/, "");
  return hex.length >= 3 ? `#${hex}` : "#FFB612";
}

function legsToGeoJson(itinerary: TripItinerary | null): GeoJSON.FeatureCollection {
  if (!itinerary) {
    return { type: "FeatureCollection", features: [] };
  }

  const features: GeoJSON.Feature[] = [];
  for (const leg of itinerary.legs) {
    const geometry = leg.geometry ?? [];
    if (geometry.length < 2) continue;
    features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: geometry.map((p) => [p.lon, p.lat]),
      },
      properties: {
        mode: leg.mode,
        color: leg.mode === "TRANSIT" ? lineColor(leg.routeColor) : "#a1a1aa",
      },
    });
  }

  return { type: "FeatureCollection", features };
}

function collectBounds(
  from: Place,
  to: Place,
  itinerary: TripItinerary | null,
): maplibregl.LngLatBounds {
  const coords: [number, number][] = [
    [from.lon, from.lat],
    [to.lon, to.lat],
  ];
  if (itinerary) {
    for (const leg of itinerary.legs) {
      for (const p of leg.geometry ?? []) coords.push([p.lon, p.lat]);
    }
  }
  return coords.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coords[0], coords[0]),
  );
}

export function PlanTripMap({ from, to, itinerary, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const fromMarkerRef = useRef<maplibregl.Marker | null>(null);
  const toMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const legGeoJson = useMemo(() => legsToGeoJson(itinerary), [itinerary]);

  const applyOverlay = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(LEGS_SOURCE_ID)) return;

    const source = map.getSource(LEGS_SOURCE_ID) as maplibregl.GeoJSONSource;
    source.setData(legGeoJson);

    fromMarkerRef.current?.remove();
    toMarkerRef.current?.remove();

    const fromEl = document.createElement("div");
    fromEl.className =
      "flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-[#FFB612] text-[11px] font-bold text-black shadow-md";
    fromEl.title = from.label ?? "From";
    fromEl.textContent = "A";
    fromMarkerRef.current = new maplibregl.Marker({ element: fromEl })
      .setLngLat([from.lon, from.lat])
      .addTo(map);

    const toEl = document.createElement("div");
    toEl.className =
      "flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-zinc-100 text-[11px] font-bold text-black shadow-md";
    toEl.title = to.label ?? "To";
    toEl.textContent = "B";
    toMarkerRef.current = new maplibregl.Marker({ element: toEl })
      .setLngLat([to.lon, to.lat])
      .addTo(map);

    map.fitBounds(collectBounds(from, to, itinerary), {
      padding: 56,
      maxZoom: 15,
      duration: itinerary ? 500 : 0,
    });
  }, [from, to, itinerary, legGeoJson]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: PITTSBURGH,
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("error", (e) => {
      if (!cancelled) {
        setMapError(e.error?.message ?? "Map failed to load");
      }
    });

    const onLoad = () => {
      if (cancelled) return;
      map.addSource(LEGS_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "plan-legs-walk",
        type: "line",
        source: LEGS_SOURCE_ID,
        filter: ["==", ["get", "mode"], "WALK"],
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#a1a1aa",
          "line-width": 4,
          "line-opacity": 0.85,
          "line-dasharray": [1.5, 1.5],
        },
      });
      map.addLayer({
        id: "plan-legs-transit",
        type: "line",
        source: LEGS_SOURCE_ID,
        filter: ["==", ["get", "mode"], "TRANSIT"],
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 5,
          "line-opacity": 0.95,
        },
      });
      map.addLayer({
        id: "plan-legs-other",
        type: "line",
        source: LEGS_SOURCE_ID,
        filter: ["all", ["!=", ["get", "mode"], "WALK"], ["!=", ["get", "mode"], "TRANSIT"]],
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#71717a",
          "line-width": 4,
          "line-opacity": 0.85,
        },
      });
      setMapReady(true);
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.once("load", onLoad);
    }

    return () => {
      cancelled = true;
      fromMarkerRef.current?.remove();
      toMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    applyOverlay();
  }, [mapReady, applyOverlay]);

  return (
    <div className={className}>
      <p className="mb-2 text-sm text-zinc-400">
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#FFB612]" /> From
        </span>
        <span className="mr-3 inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-zinc-100" /> To
        </span>
        {itinerary && (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-4 bg-[#FFB612]" /> Bus
            <span className="ml-2 inline-block h-0.5 w-4 border-b border-dashed border-zinc-400" /> Walk
          </span>
        )}
      </p>
      {mapError && (
        <p className="mb-2 text-sm text-amber-200/90">{mapError}</p>
      )}
      <div
        ref={containerRef}
        className="h-[min(55vh,440px)] w-full rounded-xl border border-zinc-800 bg-zinc-900"
      />
    </div>
  );
}
