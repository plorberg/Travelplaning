"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

// CARTO basemaps render English/latin labels (unlike raw OSM tiles, which use
// each country's native language) and ship matching light + dark styles.
const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function StopsMap({ points }: { points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || points.length === 0) return;

    let cancelled = false;
    let map: LeafletMap | undefined;
    let mql: MediaQueryList | undefined;
    let onThemeChange: (() => void) | undefined;

    // Leaflet touches `window` on import, so load it only in the browser.
    import("leaflet").then((L) => {
      if (cancelled || !el) return;

      const m = L.map(el, { scrollWheelZoom: false });
      map = m;

      const layer = L.tileLayer(prefersDark() ? TILES.dark : TILES.light, {
        attribution: ATTRIBUTION,
        maxZoom: 19,
      }).addTo(m);

      const coords = points.map((p) => [p.lat, p.lng] as [number, number]);
      points.forEach((p) => {
        L.circleMarker([p.lat, p.lng], {
          radius: 7,
          color: "#2563eb",
          weight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.9,
        })
          .addTo(m)
          .bindPopup(escapeHtml(p.label));
      });

      if (coords.length === 1) {
        m.setView(coords[0], 10);
      } else {
        m.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
      }

      // Follow the OS theme if it changes while the map is open.
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      onThemeChange = () =>
        (layer as TileLayer).setUrl(mql!.matches ? TILES.dark : TILES.light);
      mql.addEventListener("change", onThemeChange);
    });

    return () => {
      cancelled = true;
      if (mql && onThemeChange) mql.removeEventListener("change", onThemeChange);
      map?.remove();
    };
  }, [points]);

  if (points.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Map of trip stops"
      style={{ height: 320, width: "100%", marginBottom: "1rem" }}
    />
  );
}
