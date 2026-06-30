"use client";

import { useRef, useState } from "react";
import { geocodeAddressAction } from "@/app/trips/geocode-actions";

/**
 * Latitude/longitude inputs with a button that fills them by geocoding other
 * fields in the same form (by name). Controlled so the values can be set from
 * the geocoding result.
 */
export function GeocodeFields({
  defaultLat,
  defaultLng,
  candidateFieldSets,
  latError,
  lngError,
}: {
  defaultLat?: string;
  defaultLng?: string;
  // Ordered groups of input names; each group is joined into one geocoding
  // candidate and tried in order (most specific first).
  candidateFieldSets: string[][];
  latError?: string[];
  lngError?: string[];
}) {
  const [lat, setLat] = useState(defaultLat ?? "");
  const [lng, setLng] = useState(defaultLng ?? "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const btn = useRef<HTMLButtonElement>(null);

  async function geocode() {
    const form = btn.current?.form;
    if (!form) return;
    const read = (n: string) =>
      (form.elements.namedItem(n) as HTMLInputElement | null)?.value?.trim() || "";
    const clean = (q: string) =>
      q.replace(/\s*,\s*/g, ", ").replace(/(?:,\s*){2,}/g, ", ").replace(/^[,\s]+|[,\s]+$/g, "");
    const queries = candidateFieldSets
      .map((set) => clean(set.map(read).filter(Boolean).join(", ")))
      .filter(Boolean);
    if (queries.length === 0) {
      setMsg("Bitte zuerst Adresse/Ort eingeben.");
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const result = await geocodeAddressAction(queries);
      if (result) {
        setLat(String(result.lat));
        setLng(String(result.lng));
        setMsg("✓ Koordinaten übernommen.");
      } else {
        setMsg("Keine Koordinaten gefunden – ggf. genauer eingeben.");
      }
    } catch {
      setMsg("Suche fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  const label = { display: "grid", gap: "0.25rem" } as const;
  const small = { fontSize: "0.85rem", opacity: 0.8 } as const;
  const err = { color: "crimson", fontSize: "0.8rem" } as const;

  return (
    <div style={{ display: "grid", gap: "0.4rem" }}>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <label style={label}>
          <span style={small}>Breitengrad</span>
          <input name="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
          {latError?.length ? <span style={err}>{latError[0]}</span> : null}
        </label>
        <label style={label}>
          <span style={small}>Längengrad</span>
          <input name="lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
          {lngError?.length ? <span style={err}>{lngError[0]}</span> : null}
        </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" ref={btn} className="btn" onClick={geocode} disabled={loading}>
          {loading ? "Suche…" : "📍 Koordinaten aus Adresse ermitteln"}
        </button>
        {msg ? <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>{msg}</span> : null}
      </div>
    </div>
  );
}
