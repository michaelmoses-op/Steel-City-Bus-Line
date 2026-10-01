"use client";

import type { LiveVehicle } from "@steel-city/shared";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

const PITTSBURGH: [number, number] = [-79.9959, 40.4406];
const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  routeId?: string;
  className?: string;
};

function vehiclesToGeoJson(vehicles: LiveVehicle[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [v.lon, v.lat] },
      properties: {
        id: v.id,
        routeId: v.routeId ?? "",
        label: v.label ?? v.routeId ?? "?",
      },
    })),
  };
}

export function LiveMap({ routeId, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [count, setCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: PITTSBURGH,
      zoom: 11,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("vehicles", {
        type: "geojson",
        data: vehiclesToGeoJson([]),
      });
      map.addLayer({
        id: "vehicles-circle",
        type: "circle",
        source: "vehicles",
        paint: {
          "circle-radius": 7,
          "circle-color": "#f59e0b",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#1c1917",
        },
      });
      map.addLayer({
        id: "vehicles-label",
        type: "symbol",
        source: "vehicles",
        layout: {
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-offset": [0, 1.2],
        },
        paint: { "text-color": "#fafafa" },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = (vehicles: LiveVehicle[], fetchedAt: string | null) => {
      const source = map.getSource("vehicles") as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(vehiclesToGeoJson(vehicles));
      }
      setCount(vehicles.length);
      setUpdatedAt(fetchedAt);
    };

    void api.getVehicles(routeId).then(({ vehicles, fetchedAt }) => apply(vehicles, fetchedAt));

    const unsubscribe = api.subscribeVehicles(
      ({ vehicles, fetchedAt }) => apply(vehicles, fetchedAt),
      {
        routeId,
        onError: (err) => setError(err.message),
      },
    );

    return unsubscribe;
  }, [routeId]);

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <span>
          <strong className="text-amber-400">{count}</strong> buses on map
        </span>
        {updatedAt && <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span>}
        {error && <span className="text-red-400">{error}</span>}
      </div>
      <div ref={containerRef} className="h-[min(70vh,640px)] w-full rounded-xl border border-zinc-800" />
    </div>
  );
}
