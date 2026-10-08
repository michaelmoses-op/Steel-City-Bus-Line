"use client";

import type { LiveVehicle } from "@steel-city/shared";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { getApi } from "@/lib/api";
import { MAP_STYLE } from "@/lib/map-style";

const PITTSBURGH: [number, number] = [-79.9959, 40.4406];

const VEHICLE_SOURCE_ID = "vehicles";
const ROUTE_SHAPE_SOURCE_ID = "route-shape";
const ROUTE_STOPS_SOURCE_ID = "route-stops";

type MapPoint = { lat: number; lon: number };

export type RouteMapOverlay = {
  shape: MapPoint[] | null;
  stops: MapPoint[];
  routeColor?: string | null;
};

type Props = {
  routeId?: string;
  className?: string;
  /** Route line + stop dots drawn under live vehicle markers */
  routeOverlay?: RouteMapOverlay;
  mapHeightClass?: string;
};

function lineColorFromRoute(routeColor: string | null | undefined): string {
  return routeColor ? `#${routeColor}` : "#FFB612";
}

function fitMapToRoute(map: maplibregl.Map, shape: MapPoint[] | null, stops: MapPoint[]): void {
  const points: [number, number][] = [];
  if (shape && shape.length > 1) {
    for (const p of shape) points.push([p.lon, p.lat]);
  } else {
    for (const s of stops) points.push([s.lon, s.lat]);
  }
  if (points.length === 0) return;
  const bounds = points.reduce(
    (b, c) => b.extend(c),
    new maplibregl.LngLatBounds(points[0], points[0]),
  );
  map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
}

function ensureRouteOverlay(map: maplibregl.Map, overlay: RouteMapOverlay): void {
  const lineColor = lineColorFromRoute(overlay.routeColor);

  const shapeFeature =
    overlay.shape && overlay.shape.length > 1
      ? {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: overlay.shape.map((p) => [p.lon, p.lat]),
          },
          properties: {},
        }
      : null;

  const stopsCollection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: overlay.stops.map((s, i) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      properties: { i },
    })),
  };

  const existingShape = map.getSource(ROUTE_SHAPE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (shapeFeature) {
    if (existingShape) {
      existingShape.setData(shapeFeature);
    } else {
      map.addSource(ROUTE_SHAPE_SOURCE_ID, { type: "geojson", data: shapeFeature });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: ROUTE_SHAPE_SOURCE_ID,
        paint: {
          "line-color": lineColor,
          "line-width": 4,
          "line-opacity": 0.9,
        },
      });
    }
  } else if (existingShape) {
    if (map.getLayer("route-line")) map.removeLayer("route-line");
    map.removeSource(ROUTE_SHAPE_SOURCE_ID);
  }

  const existingStops = map.getSource(ROUTE_STOPS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (existingStops) {
    existingStops.setData(stopsCollection);
  } else {
    map.addSource(ROUTE_STOPS_SOURCE_ID, { type: "geojson", data: stopsCollection });
    map.addLayer({
      id: "route-stops",
      type: "circle",
      source: ROUTE_STOPS_SOURCE_ID,
      paint: {
        "circle-radius": 4,
        "circle-color": "#d4d4d8",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0a0a0a",
      },
    });
  }

  fitMapToRoute(map, overlay.shape, overlay.stops);
}

function raiseVehicleLayers(map: maplibregl.Map): void {
  if (map.getLayer("vehicles-circle")) map.moveLayer("vehicles-circle");
  if (map.getLayer("vehicles-label")) map.moveLayer("vehicles-label");
}

function buildRouteLabelMap(
  routes: { routeId: string; routeShortName: string | null }[],
): Map<string, string> {
  return new Map(routes.map((r) => [r.routeId, r.routeShortName ?? r.routeId]));
}

function vehiclesToGeoJson(
  vehicles: LiveVehicle[],
  routeLabels: Map<string, string>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => {
      const routeKey = v.routeId ?? "";
      const routeLabel = routeLabels.get(routeKey) ?? routeKey;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [v.lon, v.lat] },
        properties: {
          id: v.id,
          routeId: routeKey,
          routeLabel,
          busLabel: v.label ?? "",
        },
      };
    }),
  };
}

function ensureVehicleLayers(map: maplibregl.Map): void {
  if (!map.getSource(VEHICLE_SOURCE_ID)) {
    map.addSource(VEHICLE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getLayer("vehicles-circle")) {
    map.addLayer({
      id: "vehicles-circle",
      type: "circle",
      source: VEHICLE_SOURCE_ID,
      paint: {
        "circle-radius": 12,
        "circle-color": "#FFB612",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0a0a0a",
      },
    });
  }
  if (!map.getLayer("vehicles-label")) {
    map.addLayer({
      id: "vehicles-label",
      type: "symbol",
      source: VEHICLE_SOURCE_ID,
      layout: {
        "text-field": ["get", "routeLabel"],
        "text-size": 11,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#0a0a0a",
      },
    });
  }
}

export function LiveMap({
  routeId,
  className,
  routeOverlay,
  mapHeightClass = "h-[min(70vh,640px)]",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);
  const routeLabelsRef = useRef<Map<string, string>>(new Map());
  const latestVehiclesRef = useRef<{
    vehicles: LiveVehicle[];
    fetchedAt: string | null;
  } | null>(null);

  const [count, setCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: routes } = useQuery({
    queryKey: ["routes"],
    queryFn: () => getApi().getRoutes(),
    staleTime: 60 * 60 * 1000,
  });

  const pushVehicleDataToMap = useCallback(() => {
    const map = mapRef.current;
    const latest = latestVehiclesRef.current;
    if (!map || !mapReadyRef.current || !latest) return;
    if (!map.isStyleLoaded()) return;

    ensureVehicleLayers(map);
    const source = map.getSource(VEHICLE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData(vehiclesToGeoJson(latest.vehicles, routeLabelsRef.current));
    setCount(latest.vehicles.length);
    setUpdatedAt(latest.fetchedAt);
  }, []);

  const applyVehicleUpdate = useCallback(
    (vehicles: LiveVehicle[], fetchedAt: string | null) => {
      latestVehiclesRef.current = { vehicles, fetchedAt };
      pushVehicleDataToMap();
    },
    [pushVehicleDataToMap],
  );

  useEffect(() => {
    if (routes) {
      routeLabelsRef.current = buildRouteLabelMap(routes);
      pushVehicleDataToMap();
    }
  }, [routes, pushVehicleDataToMap]);

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

    const onReady = () => {
      mapReadyRef.current = true;
      if (routeOverlay) {
        ensureRouteOverlay(map, routeOverlay);
      }
      ensureVehicleLayers(map);
      raiseVehicleLayers(map);
      pushVehicleDataToMap();
    };

    if (map.isStyleLoaded()) {
      onReady();
    } else {
      map.on("load", onReady);
    }

    return () => {
      mapReadyRef.current = false;
      map.off("load", onReady);
      map.remove();
      mapRef.current = null;
    };
  }, [pushVehicleDataToMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !routeOverlay || !map.isStyleLoaded()) return;
    ensureRouteOverlay(map, routeOverlay);
    ensureVehicleLayers(map);
    raiseVehicleLayers(map);
    pushVehicleDataToMap();
  }, [routeOverlay, pushVehicleDataToMap]);

  useEffect(() => {
    const client = getApi();
    void client.getVehicles(routeId).then(
      ({ vehicles, fetchedAt }) => {
        setError(null);
        applyVehicleUpdate(vehicles, fetchedAt);
      },
      (err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load vehicles. Is the API running on port 4000?",
        );
      },
    );

    const unsubscribe = client.subscribeVehicles(
      ({ vehicles, fetchedAt }) => {
        setError(null);
        applyVehicleUpdate(vehicles, fetchedAt);
      },
      {
        routeId,
        onError: () => {
          setError("Live stream interrupted — retrying…");
        },
      },
    );

    return unsubscribe;
  }, [routeId, applyVehicleUpdate]);

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
        <span>
          <strong className="text-[#FFB612]">{count}</strong> buses on map
        </span>
        {updatedAt && <span>Updated {new Date(updatedAt).toLocaleTimeString()}</span>}
        {error && <span className="text-amber-200/90">{error}</span>}
      </div>
      <div
        ref={containerRef}
        className={`${mapHeightClass} w-full rounded-xl border border-zinc-800`}
      />
    </div>
  );
}
