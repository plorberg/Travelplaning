"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/trips/actions";
import { GeocodeFields } from "@/app/trips/_components/GeocodeFields";

type Defaults = {
  city?: string;
  country?: string;
  arrivalDate?: string;
  departureDate?: string;
  accommodationName?: string;
  accommodationAddress?: string;
  lat?: string;
  lng?: string;
  notes?: string;
  highlights?: string;
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

export function StopForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form
      action={formAction}
      style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}
    >
      <Field label="Stadt / Ort" error={fe.city}>
        <input name="city" defaultValue={defaults.city ?? ""} required />
      </Field>
      <Field label="Land" error={fe.country}>
        <input name="country" defaultValue={defaults.country ?? ""} />
      </Field>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Ankunftsdatum" error={fe.arrivalDate}>
          <input type="date" name="arrivalDate" defaultValue={defaults.arrivalDate ?? ""} />
        </Field>
        <Field label="Abreisedatum" error={fe.departureDate}>
          <input type="date" name="departureDate" defaultValue={defaults.departureDate ?? ""} />
        </Field>
      </div>
      <Field label="Unterkunft (Name)" error={fe.accommodationName}>
        <input name="accommodationName" defaultValue={defaults.accommodationName ?? ""} />
      </Field>
      <Field label="Unterkunft (Adresse)" error={fe.accommodationAddress}>
        <input
          name="accommodationAddress"
          defaultValue={defaults.accommodationAddress ?? ""}
        />
      </Field>
      <GeocodeFields
        defaultLat={defaults.lat}
        defaultLng={defaults.lng}
        queryFields={["accommodationAddress", "city", "country"]}
        latError={fe.lat}
        lngError={fe.lng}
      />
      <Field label="Schwerpunkte / Highlights (für die Roadtrip-Tabelle)" error={fe.highlights}>
        <textarea name="highlights" rows={2} defaultValue={defaults.highlights ?? ""} />
      </Field>
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
