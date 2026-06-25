"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/map-points";

const STOP_COLOR = "#1d4ed8";
const SPOT_COLOR = "#b45309";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function TripMap({ points }: { points: MapPoint[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Leaflet touches `window`, so load it only on the client (in the effect).
    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;

      map = L.map(ref.current);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap-Mitwirkende",
      }).addTo(map);

      const latlngs: [number, number][] = [];
      for (const p of points) {
        const color = p.kind === "stop" ? STOP_COLOR : SPOT_COLOR;
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 7,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(map);
        marker.bindPopup(
          `<strong>${escapeHtml(p.name)}</strong>${
            p.sub ? `<br/>${escapeHtml(p.sub)}` : ""
          }`,
        );
        latlngs.push([p.lat, p.lng]);
      }

      if (latlngs.length === 1) map.setView(latlngs[0], 12);
      else if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [30, 30] });
      else map.setView([20, 0], 2);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div
        ref={ref}
        style={{ height: 480, width: "100%", borderRadius: 8, overflow: "hidden" }}
      />
      <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.85rem", opacity: 0.85 }}>
        <span>
          <span style={{ color: STOP_COLOR }}>●</span> Stationen
        </span>
        <span>
          <span style={{ color: SPOT_COLOR }}>●</span> Gespeicherte Orte
        </span>
      </div>
    </div>
  );
}
