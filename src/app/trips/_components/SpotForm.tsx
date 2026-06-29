"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/trips/actions";
import { spotCategoryValues } from "@/lib/validation";
import { spotCategoryLabels } from "@/lib/labels";

type Defaults = {
  name?: string;
  category?: string;
  stopId?: string;
  address?: string;
  lat?: string;
  lng?: string;
  rating?: string;
  source?: string;
  recommendedDurationMinutes?: string;
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

export function SpotForm({
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
      <Field label="Name" error={fe.name}>
        <input name="name" defaultValue={defaults.name ?? ""} required />
      </Field>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Kategorie" error={fe.category}>
          <select name="category" defaultValue={defaults.category ?? ""}>
            <option value="">—</option>
            {spotCategoryValues.map((c) => (
              <option key={c} value={c}>
                {spotCategoryLabels[c] ?? c}
              </option>
            ))}
          </select>
        </Field>
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
      </div>
      <Field label="Adresse" error={fe.address}>
        <input name="address" defaultValue={defaults.address ?? ""} />
      </Field>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Bewertung (0–5)" error={fe.rating}>
          <input name="rating" inputMode="decimal" defaultValue={defaults.rating ?? ""} style={{ width: 100 }} />
        </Field>
        <Field label="Empf. Dauer (Min.)" error={fe.recommendedDurationMinutes}>
          <input
            name="recommendedDurationMinutes"
            inputMode="numeric"
            defaultValue={defaults.recommendedDurationMinutes ?? ""}
            style={{ width: 140 }}
          />
        </Field>
      </div>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Breitengrad" error={fe.lat}>
          <input name="lat" inputMode="decimal" defaultValue={defaults.lat ?? ""} />
        </Field>
        <Field label="Längengrad" error={fe.lng}>
          <input name="lng" inputMode="decimal" defaultValue={defaults.lng ?? ""} />
        </Field>
      </div>
      <Field label="Quelle (z. B. Wikivoyage, Empfehlung)" error={fe.source}>
        <input name="source" defaultValue={defaults.source ?? ""} />
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
