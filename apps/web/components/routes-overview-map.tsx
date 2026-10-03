"use client";

import type { LiveVehicle, RouteMapShape } from "@steel-city/shared";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlanOptionGroup } from "@/components/plan-option-group";
import { getApi } from "@/lib/api";

const PITTSBURGH: [number, number] = [-79.9959, 40.4406];
const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

const ROUTES_SOURCE_ID = "routes-overview";
const STOPS_SOURCE_ID = "routes-overview-stops";
const VEHICLE_SOURCE_ID = "routes-overview-vehicles";

type MapMode = "all" | "live";

type Props = {
  shapes: RouteMapShape[];
  liveRouteIds: Set<string>;
  selectedRouteId: string | null;
  onSelectedRouteIdChange: (routeId: string | null) => void;
  mapMode: MapMode;
  onMapModeChange: (mode: MapMode) => void;
};

function routeLineColor(routeColor: string | null | undefined): string {
  return routeColor ? `#${routeColor.replace(/^#/, "")}` : "#FFB612";
}

function shapesToGeoJson(
  shapes: RouteMapShape[],
  selectedRouteId: string | null,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: shapes
      .filter((s) => s.shape.length >= 2)
      .map((s) => ({
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: s.shape.map((p: { lat: number; lon: number }) => [p.lon, p.lat]),
        },
        properties: {
          routeId: s.routeId,
          routeLabel: s.routeShortName ?? s.routeId,
          color: routeLineColor(s.routeColor),
          selected: selectedRouteId === s.routeId,
        },
      })),
  };
}

function fitToShapes(map: maplibregl.Map, shapes: RouteMapShape[]): void {
  const coords: [number, number][] = [];
  for (const s of shapes) {
    for (const p of s.shape) coords.push([p.lon, p.lat]);
  }
  if (coords.length === 0) return;
  const bounds = coords.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(coords[0], coords[0]),
  );
  map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 500 });
}

function vehiclesToGeoJson(
  vehicles: LiveVehicle[],
  labels: Map<string, string>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [v.lon, v.lat] },
      properties: {
        id: v.id,
        routeLabel: labels.get(v.routeId ?? "") ?? v.routeId ?? "",
      },
    })),
  };
}

export function RoutesOverviewMap({
  shapes,
  liveRouteIds,
  selectedRouteId,
  onSelectedRouteIdChange,
  mapMode,
  onMapModeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const onSelectRef = useRef(onSelectedRouteIdChange);
  const selectedRef = useRef(selectedRouteId);
  const initialFitDoneRef = useRef(false);
  const lastFitRouteRef = useRef<string | null>(null);
  const [busCount, setBusCount] = useState(0);

  onSelectRef.current = onSelectedRouteIdChange;
  selectedRef.current = selectedRouteId;

  const visibleShapes = useMemo(() => {
    if (selectedRouteId) {
      return shapes.filter((s) => s.routeId === selectedRouteId);
    }
    if (mapMode === "live") {
      return shapes.filter((s) => liveRouteIds.has(s.routeId));
    }
    return shapes;
  }, [shapes, selectedRouteId, mapMode, liveRouteIds]);

  const selectedMeta = useMemo(
    () => shapes.find((s) => s.routeId === selectedRouteId) ?? null,
    [shapes, selectedRouteId],
  );

  const routeGeoJson = useMemo(
    () => shapesToGeoJson(visibleShapes, selectedRouteId),
    [visibleShapes, selectedRouteId],
  );

  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => getApi().getRoutes(),
    staleTime: 60 * 60 * 1000,
  });

  const routeLabels = useMemo(
    () => new Map((routes ?? []).map((r) => [r.routeId, r.routeShortName ?? r.routeId])),
    [routes],
  );

  const { data: selectedDetail } = useQuery({
    queryKey: ["route", selectedRouteId],
    queryFn: () => getApi().getRoute(selectedRouteId!),
    enabled: !!selectedRouteId,
    staleTime: 30 * 60 * 1000,
  });

  const stopsGeoJson = useMemo((): GeoJSON.FeatureCollection => {
    if (!selectedDetail?.stops.length) {
      return { type: "FeatureCollection", features: [] };
    }
    return {
      type: "FeatureCollection",
      features: selectedDetail.stops.map((s, i) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.lon, s.lat] },
        properties: { i },
      })),
    };
  }, [selectedDetail?.stops]);

  const applyRouteLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.getSource(ROUTES_SOURCE_ID)) return;

    (map.getSource(ROUTES_SOURCE_ID) as maplibregl.GeoJSONSource).setData(routeGeoJson);

    const stopsSource = map.getSource(STOPS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    stopsSource?.setData(stopsGeoJson);
  }, [routeGeoJson, stopsGeoJson]);

  const pushVehicles = useCallback(
    (vehicles: LiveVehicle[]) => {
      const map = mapRef.current;
      if (!map || !mapReady || !selectedRouteId) return;
      const source = map.getSource(VEHICLE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData(vehiclesToGeoJson(vehicles, routeLabels));
      setBusCount(vehicles.length);
    },
    [mapReady, selectedRouteId, routeLabels],
  );

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

    const onLoad = () => {
      setMapReady(true);

      map.addSource(ROUTES_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "routes-hit",
        type: "line",
        source: ROUTES_SOURCE_ID,
        paint: {
          "line-color": "transparent",
          "line-width": 14,
          "line-opacity": 0,
        },
      });

      map.addLayer({
        id: "routes-line",
        type: "line",
        source: ROUTES_SOURCE_ID,
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["get", "selected"], 6, 3],
          "line-opacity": ["case", ["get", "selected"], 1, 0.55],
        },
      });

      map.addSource(STOPS_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "routes-stops",
        type: "circle",
        source: STOPS_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "#d4d4d8",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0a0a0a",
        },
      });

      map.addSource(VEHICLE_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "routes-vehicles-circle",
        type: "circle",
        source: VEHICLE_SOURCE_ID,
        paint: {
          "circle-radius": 12,
          "circle-color": "#FFB612",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0a0a0a",
        },
      });
      map.addLayer({
        id: "routes-vehicles-label",
        type: "symbol",
        source: VEHICLE_SOURCE_ID,
        layout: {
          "text-field": ["get", "routeLabel"],
          "text-size": 11,
          "text-allow-overlap": true,
        },
        paint: { "text-color": "#0a0a0a" },
      });

      map.on("click", "routes-hit", (e) => {
        const routeId = e.features?.[0]?.properties?.routeId as string | undefined;
        if (!routeId) return;
        const next = selectedRef.current === routeId ? null : routeId;
        onSelectRef.current(next);
      });

      map.on("mouseenter", "routes-hit", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "routes-hit", () => {
        map.getCanvas().style.cursor = "";
      });

    };

    if (map.isStyleLoaded()) onLoad();
    else map.once("load", onLoad);

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    applyRouteLayers();
  }, [mapReady, applyRouteLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || initialFitDoneRef.current || shapes.length === 0) return;
    fitToShapes(map, shapes);
    initialFitDoneRef.current = true;
  }, [mapReady, shapes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    if (!selectedRouteId) {
      lastFitRouteRef.current = null;
      return;
    }
    if (lastFitRouteRef.current === selectedRouteId) return;
    const focused = shapes.filter((s) => s.routeId === selectedRouteId);
    if (focused.length === 0) return;
    fitToShapes(map, focused);
    lastFitRouteRef.current = selectedRouteId;
  }, [mapReady, selectedRouteId, shapes]);

  useEffect(() => {
    if (!selectedRouteId) {
      setBusCount(0);
      const map = mapRef.current;
      const source = map?.getSource(VEHICLE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      source?.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const client = getApi();
    void client.getVehicles(selectedRouteId).then(({ vehicles }) => {
      pushVehicles(vehicles);
    });

    const unsub = client.subscribeVehicles(
      ({ vehicles }) => pushVehicles(vehicles),
      { routeId: selectedRouteId },
    );
    return unsub;
  }, [selectedRouteId, pushVehicles]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PlanOptionGroup
          legend="Map routes"
          name="routes-map-mode"
          value={mapMode}
          onChange={onMapModeChange}
          options={[
            { id: "all", label: "All routes" },
            { id: "live", label: "Live only" },
          ]}
        />
        <p className="text-xs text-zinc-500 max-w-sm">
          {selectedRouteId ? (
            <>
              Selected{" "}
              <span className="font-semibold text-zinc-300">
                {selectedMeta?.routeShortName ?? selectedRouteId}
              </span>
              — click the line again to show all.{" "}
              <Link
                href={`/routes/${encodeURIComponent(selectedRouteId)}`}
                className="text-[#FFB612] hover:underline"
              >
                Route detail
              </Link>
              {busCount > 0 && (
                <span className="text-zinc-400">
                  {" "}
                  · {busCount} {busCount === 1 ? "bus" : "buses"} live
                </span>
              )}
            </>
          ) : (
            "Click a route line to focus it, show stops, and live buses."
          )}
        </p>
      </div>

      {mapMode === "live" && !selectedRouteId && visibleShapes.length === 0 && (
        <p className="text-sm text-zinc-500">No live routes right now — switch to All routes or check again soon.</p>
      )}

      <div
        ref={containerRef}
        className="h-[min(55vh,480px)] w-full rounded-xl border border-zinc-800 bg-zinc-900"
      />
    </div>
  );
}
