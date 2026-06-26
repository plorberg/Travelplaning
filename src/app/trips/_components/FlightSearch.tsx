"use client";

import { useState } from "react";
import Link from "next/link";
import {
  buildGoogleFlightsUrl,
  buildSkyscannerUrl,
  cabinClassValues,
  type CabinClass,
} from "@/lib/flights";
import { cabinClassLabels } from "@/lib/labels";
import { AirportInput } from "./AirportInput";

type Defaults = {
  departDate?: string;
  returnDate?: string;
  currency?: string;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{label}</span>
      {children}
    </label>
  );
}

export function FlightSearch({
  defaults = {},
  documentsHref,
}: {
  defaults?: Defaults;
  documentsHref: string;
}) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState(defaults.departDate ?? "");
  const [returnDate, setReturnDate] = useState(defaults.returnDate ?? "");
  const [passengers, setPassengers] = useState("1");
  const [cabin, setCabin] = useState<CabinClass | "">("");

  const criteria = {
    origin,
    destination,
    departDate: departDate || undefined,
    returnDate: returnDate || undefined,
    passengers: Number(passengers) || 1,
    cabin: cabin || undefined,
    currency: defaults.currency,
  };
  const skyscanner = buildSkyscannerUrl(criteria);
  const google = buildGoogleFlightsUrl(criteria);
  const ready = Boolean(origin && destination);

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 480 }}>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <AirportInput
          label="Von (Flughafen)"
          placeholder="Stadt oder Code, z. B. Berlin / BER"
          onSelect={setOrigin}
        />
        <AirportInput
          label="Nach (Flughafen)"
          placeholder="Stadt oder Code, z. B. Auckland / AKL"
          onSelect={setDestination}
        />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Field label="Hinflug">
            <input type="date" value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
          </Field>
          <Field label="Rückflug (optional)">
            <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Field label="Reisende">
            <input
              type="number"
              min={1}
              max={9}
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              style={{ width: 80 }}
            />
          </Field>
          <Field label="Klasse">
            <select value={cabin} onChange={(e) => setCabin(e.target.value as CabinClass | "")}>
              <option value="">—</option>
              {cabinClassValues.map((c) => (
                <option key={c} value={c}>
                  {cabinClassLabels[c] ?? c}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {ready && skyscanner ? (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <a
            href={skyscanner}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ display: "inline-block", padding: "0.6rem 1rem", borderRadius: 6, textAlign: "center", fontWeight: 600 }}
          >
            Auf Skyscanner suchen ↗
          </a>
          {google ? (
            <a href={google} target="_blank" rel="noreferrer" style={{ fontSize: "0.9rem" }}>
              … oder mit Google Flights öffnen ↗
            </a>
          ) : null}
        </div>
      ) : (
        <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>
          Wähle Start- und Zielflughafen aus der Liste, um die Suche zu öffnen.
        </p>
      )}

      <p style={{ opacity: 0.8, fontSize: "0.85rem" }}>
        Wähle deinen Flug aus und{" "}
        <Link href={documentsHref}>speichere ihn als Dokument</Link> (Typ „Flug"),
        um Buchungsnummer, Zeiten und Preis festzuhalten.
      </p>
    </div>
  );
}
