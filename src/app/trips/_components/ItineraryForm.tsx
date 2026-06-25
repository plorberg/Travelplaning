"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/trips/actions";
import { itineraryItemTypeValues } from "@/lib/validation";
import { itineraryItemTypeLabels } from "@/lib/labels";

type Defaults = {
  title?: string;
  type?: string;
  stopId?: string;
  savedSpotId?: string;
  documentId?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  lat?: string;
  lng?: string;
  cost?: string;
  currency?: string;
  notes?: string;
};

type SpotOption = {
  id: string;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: "0.25rem" }}>
      <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>{label}</span>
      {children}
      {error?.length ? (
        <span style={{ color: "crimson", fontSize: "0.8rem" }}>{error[0]}</span>
      ) : null}
    </label>
  );
}

export function ItineraryForm({
  action,
  defaults = {},
  submitLabel,
  stops,
  savedSpots = [],
  documents = [],
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
  stops: { id: string; city: string }[];
  savedSpots?: SpotOption[];
  documents?: { id: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};

  // Controlled so picking a linked recommendation can fill them in.
  const [location, setLocation] = useState(defaults.location ?? "");
  const [lat, setLat] = useState(defaults.lat ?? "");
  const [lng, setLng] = useState(defaults.lng ?? "");

  function onSpotSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const spot = savedSpots.find((s) => s.id === e.target.value);
    if (!spot) return;
    if (spot.address) setLocation(spot.address);
    if (spot.lat != null) setLat(String(spot.lat));
    if (spot.lng != null) setLng(String(spot.lng));
  }

  return (
    <form
      action={formAction}
      style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}
    >
      <Field label="Titel" error={fe.title}>
        <input name="title" defaultValue={defaults.title ?? ""} required />
      </Field>
      <Field label="Typ" error={fe.type}>
        <select name="type" defaultValue={defaults.type ?? "activity"}>
          {itineraryItemTypeValues.map((t) => (
            <option key={t} value={t}>
              {itineraryItemTypeLabels[t] ?? t}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Beginn" error={fe.startAt}>
          <input type="datetime-local" name="startAt" defaultValue={defaults.startAt ?? ""} />
        </Field>
        <Field label="Ende" error={fe.endAt}>
          <input type="datetime-local" name="endAt" defaultValue={defaults.endAt ?? ""} />
        </Field>
      </div>
      <Field label="Station" error={fe.stopId}>
        <select name="stopId" defaultValue={defaults.stopId ?? ""}>
          <option value="">— keine —</option>
          {stops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.city}
            </option>
          ))}
        </select>
      </Field>
      {savedSpots.length > 0 ? (
        <Field label="Verknüpfte Empfehlung (füllt Ort & Koordinaten)" error={fe.savedSpotId}>
          <select name="savedSpotId" defaultValue={defaults.savedSpotId ?? ""} onChange={onSpotSelect}>
            <option value="">— keine —</option>
            {savedSpots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {documents.length > 0 ? (
        <Field label="Verknüpftes Dokument" error={fe.documentId}>
          <select name="documentId" defaultValue={defaults.documentId ?? ""}>
            <option value="">— keines —</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Ort" error={fe.location}>
        <input name="location" value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Breitengrad" error={fe.lat}>
          <input name="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
        </Field>
        <Field label="Längengrad" error={fe.lng}>
          <input name="lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Kosten" error={fe.cost}>
          <input name="cost" inputMode="decimal" defaultValue={defaults.cost ?? ""} />
        </Field>
        <Field label="Währung" error={fe.currency}>
          <input name="currency" maxLength={3} defaultValue={defaults.currency ?? ""} style={{ width: 80 }} />
        </Field>
      </div>
      <Field label="Notizen" error={fe.notes}>
        <textarea name="notes" rows={3} defaultValue={defaults.notes ?? ""} />
      </Field>

      {state.error ? <p style={{ color: "crimson" }}>{state.error}</p> : null}
      <button type="submit" className="btn-primary" disabled={pending} style={{ padding: "0.5rem 1rem" }}>
        {pending ? "Wird gespeichert…" : submitLabel}
      </button>
    </form>
  );
}
