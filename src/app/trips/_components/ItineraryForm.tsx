"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/trips/actions";
import { itineraryItemTypeValues } from "@/lib/validation";

type Defaults = {
  title?: string;
  type?: string;
  stopId?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  lat?: string;
  lng?: string;
  cost?: string;
  currency?: string;
  notes?: string;
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
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
  stops: { id: string; city: string }[];
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
      <Field label="Title" error={fe.title}>
        <input name="title" defaultValue={defaults.title ?? ""} required />
      </Field>
      <Field label="Type" error={fe.type}>
        <select name="type" defaultValue={defaults.type ?? "activity"}>
          {itineraryItemTypeValues.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Start" error={fe.startAt}>
          <input type="datetime-local" name="startAt" defaultValue={defaults.startAt ?? ""} />
        </Field>
        <Field label="End" error={fe.endAt}>
          <input type="datetime-local" name="endAt" defaultValue={defaults.endAt ?? ""} />
        </Field>
      </div>
      <Field label="Stop" error={fe.stopId}>
        <select name="stopId" defaultValue={defaults.stopId ?? ""}>
          <option value="">— none —</option>
          {stops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.city}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Location" error={fe.location}>
        <input name="location" defaultValue={defaults.location ?? ""} />
      </Field>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Latitude" error={fe.lat}>
          <input name="lat" inputMode="decimal" defaultValue={defaults.lat ?? ""} />
        </Field>
        <Field label="Longitude" error={fe.lng}>
          <input name="lng" inputMode="decimal" defaultValue={defaults.lng ?? ""} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Cost" error={fe.cost}>
          <input name="cost" inputMode="decimal" defaultValue={defaults.cost ?? ""} />
        </Field>
        <Field label="Currency" error={fe.currency}>
          <input name="currency" maxLength={3} defaultValue={defaults.currency ?? ""} style={{ width: 80 }} />
        </Field>
      </div>
      <Field label="Notes" error={fe.notes}>
        <textarea name="notes" rows={3} defaultValue={defaults.notes ?? ""} />
      </Field>

      {state.error ? <p style={{ color: "crimson" }}>{state.error}</p> : null}
      <button type="submit" disabled={pending} style={{ padding: "0.5rem 1rem" }}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
