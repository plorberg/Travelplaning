"use client";

import { useState } from "react";
import { buildGoogleFlightsUrl, type CabinClass } from "@/lib/flights";

const CABINS: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const labelStyle = { display: "grid", gap: "0.25rem" } as const;
const capStyle = { fontSize: "0.85rem", opacity: 0.8 } as const;

export function FlightSearch({
  destinationDefault = "",
}: {
  destinationDefault?: string;
}) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState(destinationDefault);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabin, setCabin] = useState<CabinClass>("economy");

  const url = buildGoogleFlightsUrl({
    origin,
    destination,
    departDate: departDate || undefined,
    returnDate: returnDate || undefined,
    passengers,
    cabin,
  });
  const ready = url !== "";

  return (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={labelStyle}>
          <span style={capStyle}>From</span>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="City or airport"
          />
        </label>
        <label style={labelStyle}>
          <span style={capStyle}>To</span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City or airport"
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={labelStyle}>
          <span style={capStyle}>Depart</span>
          <input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
          />
        </label>
        <label style={labelStyle}>
          <span style={capStyle}>Return (optional)</span>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <label style={labelStyle}>
          <span style={capStyle}>Passengers</span>
          <input
            type="number"
            min={1}
            max={9}
            value={passengers}
            onChange={(e) =>
              setPassengers(Math.max(1, Math.min(9, Number(e.target.value) || 1)))
            }
            style={{ width: 90 }}
          />
        </label>
        <label style={labelStyle}>
          <span style={capStyle}>Cabin</span>
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value as CabinClass)}
          >
            {CABINS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <a
        href={ready ? url : undefined}
        target="_blank"
        rel="noreferrer"
        aria-disabled={!ready}
        style={{
          justifySelf: "start",
          padding: "0.5rem 1rem",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "var(--surface)",
          color: ready ? "var(--fg)" : "var(--muted)",
          pointerEvents: ready ? "auto" : "none",
          textDecoration: "none",
        }}
      >
        Search on Google Flights ↗
      </a>
      <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: 0 }}>
        Opens Google Flights in a new tab. After booking, save the details under{" "}
        <strong>Documents</strong>.
      </p>
    </div>
  );
}
