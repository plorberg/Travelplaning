"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { MapPoint } from "@/lib/map-points";
import { STOP_COLOR, spotColor } from "@/lib/spot-colors";
import { spotCategoryLabels } from "@/lib/labels";

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
        const isStop = p.kind === "stop";
        const color = isStop ? STOP_COLOR : spotColor(p.category);
        const marker = L.circleMarker([p.lat, p.lng], {
          // Stops are larger with a white ring so they stand out from the
          // category-coloured spot dots.
          radius: isStop ? 9 : 6,
          color: isStop ? "#ffffff" : color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: isStop ? 3 : 2,
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

  // Distinct spot categories present, for the legend (insertion order).
  const spotCategories = Array.from(
    new Set(points.filter((p) => p.kind === "spot").map((p) => p.category ?? "")),
  );

  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div
        ref={ref}
        style={{ height: 480, width: "100%", borderRadius: 8, overflow: "hidden" }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 1rem", fontSize: "0.85rem", opacity: 0.85 }}>
        {points.some((p) => p.kind === "stop") ? (
          <span>
            <span style={{ color: STOP_COLOR }}>●</span> Stationen
          </span>
        ) : null}
        {spotCategories.map((c) => (
          <span key={c || "spot"}>
            <span style={{ color: spotColor(c) }}>●</span>{" "}
            {c ? spotCategoryLabels[c] ?? c : "Empfehlung"}
          </span>
        ))}
      </div>
    </div>
  );
}
