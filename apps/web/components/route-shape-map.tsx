"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://tiles.openfreemap.org/styles/liberty";

type Point = { lat: number; lon: number };

type Props = {
  shape: Point[] | null;
  stops: Point[];
  routeColor?: string | null;
};

export function RouteShapeMap({ shape, stops, routeColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const center: [number, number] =
      stops[0] !== undefined
        ? [stops[0].lon, stops[0].lat]
        : [-79.9959, 40.4406];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom: 12,
    });

    map.on("load", () => {
      if (shape && shape.length > 1) {
        map.addSource("route-shape", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: shape.map((p) => [p.lon, p.lat]),
            },
            properties: {},
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-shape",
          paint: {
            "line-color": routeColor ? `#${routeColor}` : "#f59e0b",
            "line-width": 4,
          },
        });
      }

      map.addSource("route-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: stops.map((s, i) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [s.lon, s.lat] },
            properties: { i },
          })),
        },
      });
      map.addLayer({
        id: "route-stops",
        type: "circle",
        source: "route-stops",
        paint: {
          "circle-radius": 4,
          "circle-color": "#e4e4e7",
        },
      });

      if (shape && shape.length > 1) {
        const coords = shape.map((p) => [p.lon, p.lat] as [number, number]);
        const bounds = coords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(coords[0], coords[0]),
        );
        map.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => map.remove();
  }, [shape, stops, routeColor]);

  return (
    <div ref={containerRef} className="h-80 w-full rounded-xl border border-zinc-800" />
  );
}
