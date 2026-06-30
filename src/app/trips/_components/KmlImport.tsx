"use client";

import { useState } from "react";
import { spotCategoryLabels } from "@/lib/labels";
import { kmlCategory } from "@/lib/places/kml-category";

type ParsedSpot = {
  name: string;
  lat: number;
  lng: number;
  category?: string;
  notes?: string;
  source: string;
};

type ImportResult = { imported?: number; error?: string };

function directChildText(el: Element, tag: string): string | undefined {
  for (const child of Array.from(el.children)) {
    if (child.localName === tag) return child.textContent?.trim() || undefined;
  }
  return undefined;
}

function nearestLayer(placemark: Element): string | undefined {
  let el: Element | null = placemark.parentElement;
  while (el) {
    if (el.localName === "Folder" || el.localName === "Document") {
      const name = directChildText(el, "name");
      if (name) return name;
    }
    el = el.parentElement;
  }
  return undefined;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

// Parses a Google My Maps / Google Earth KML string into point spots.
function parseKml(text: string): ParsedSpot[] {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Die Datei ist kein gültiges KML.");
  }
  const spots: ParsedSpot[] = [];
  for (const pm of Array.from(doc.getElementsByTagName("Placemark"))) {
    const point = pm.getElementsByTagName("Point")[0]; // points only (no lines/areas)
    const coords = point?.getElementsByTagName("coordinates")[0]?.textContent?.trim();
    if (!coords) continue;
    const [lngStr, latStr] = coords.split(/\s+/)[0].split(",");
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const name = (directChildText(pm, "name") || "Unbenannt").slice(0, 200);
    const descRaw = directChildText(pm, "description");
    const notes = descRaw ? stripHtml(descRaw).slice(0, 2000) || undefined : undefined;
    const category = kmlCategory(nearestLayer(pm)) ?? undefined;
    spots.push({ name, lat, lng, category, notes, source: "Google My Maps" });
  }
  return spots;
}

export function KmlImport({
  action,
  spotsHref,
}: {
  action: (spots: ParsedSpot[]) => Promise<ImportResult>;
  spotsHref: string;
}) {
  const [spots, setSpots] = useState<ParsedSpot[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const parsed = parseKml(await file.text());
      if (parsed.length === 0) {
        setSpots(null);
        setError("Keine Orte mit Koordinaten in der Datei gefunden.");
        return;
      }
      setSpots(parsed);
    } catch (err) {
      setSpots(null);
      setError(err instanceof Error ? err.message : "Datei konnte nicht gelesen werden.");
    }
  }

  async function onImport() {
    if (!spots) return;
    setImporting(true);
    setError(null);
    try {
      const res = await action(spots);
      setResult(res);
      if (res.imported) setSpots(null);
    } catch {
      setError("Import fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setImporting(false);
    }
  }

  // Category breakdown for the preview.
  const byCategory = new Map<string, number>();
  for (const s of spots ?? []) {
    const key = s.category ?? "";
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
  }

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 560 }}>
      <div
        style={{
          display: "grid",
          gap: "0.4rem",
          padding: "0.75rem 0.9rem",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}
      >
        <label style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          KML-Datei (aus Google My Maps: „⋮ → In KML/KMZ exportieren" →
          Häkchen „Export als KML")
        </label>
        <input type="file" accept=".kml,application/vnd.google-earth.kml+xml" onChange={onFile} />
        {fileName ? <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>{fileName}</span> : null}
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {result?.imported ? (
        <p style={{ color: "green" }}>
          ✓ {result.imported} Orte importiert.{" "}
          <a href={spotsHref}>Zu den Empfehlungen →</a>
        </p>
      ) : null}
      {result?.error ? <p style={{ color: "crimson" }}>{result.error}</p> : null}

      {spots ? (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <strong>{spots.length} Orte gefunden</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem 0.75rem", fontSize: "0.85rem", opacity: 0.85 }}>
            {Array.from(byCategory.entries()).map(([cat, n]) => (
              <span key={cat || "none"}>
                {cat ? spotCategoryLabels[cat] ?? cat : "ohne Kategorie"}: {n}
              </span>
            ))}
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: "0.5rem 0.75rem",
              margin: 0,
              display: "grid",
              gap: "0.3rem",
              maxHeight: 260,
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontSize: "0.85rem",
            }}
          >
            {spots.map((s, i) => (
              <li key={i}>
                {s.name}
                {s.category ? (
                  <span style={{ opacity: 0.6 }}> · {spotCategoryLabels[s.category] ?? s.category}</span>
                ) : null}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-primary"
            onClick={onImport}
            disabled={importing}
            style={{ padding: "0.5rem 1rem", justifySelf: "start" }}
          >
            {importing ? "Wird importiert…" : `${spots.length} Orte importieren`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
