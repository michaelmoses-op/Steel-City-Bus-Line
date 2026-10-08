"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

import { MAP_STYLE } from "@/lib/map-style";

type Props = {
  lat: number;
  lon: number;
  stopName: string;
  className?: string;
};

export function StopLocationMap({ lat, lon, stopName, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [lon, lat],
      zoom: 16,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.once("load", () => setMapReady(true));

    return () => {
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    map.jumpTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 15) });

    markerRef.current?.remove();
    const el = document.createElement("div");
    el.className =
      "flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-[#FFB612] shadow-md";
    el.title = stopName;
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0a0a0a"/><circle cx="12" cy="9" r="2.5" fill="#FFB612"/></svg>';

    markerRef.current = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lon, lat])
      .addTo(map);
  }, [mapReady, lat, lon, stopName]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="h-[min(45vh,380px)] w-full rounded-xl border border-zinc-800 bg-zinc-900"
        role="img"
        aria-label={`Map showing ${stopName}`}
      />
    </div>
  );
}
