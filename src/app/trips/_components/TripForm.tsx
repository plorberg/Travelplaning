"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/trips/actions";
import { tripStatusValues, travelStyleValues } from "@/lib/validation";

type Defaults = {
  name?: string;
  mainDestination?: string;
  startDate?: string;
  endDate?: string;
  homeCurrency?: string;
  budget?: string;
  status?: string;
  travelStyle?: string;
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

export function TripForm({
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
      <Field label="Trip name" error={fe.name}>
        <input name="name" defaultValue={defaults.name ?? ""} required />
      </Field>
      <Field label="Main destination" error={fe.mainDestination}>
        <input
          name="mainDestination"
          defaultValue={defaults.mainDestination ?? ""}
        />
      </Field>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Start date" error={fe.startDate}>
          <input type="date" name="startDate" defaultValue={defaults.startDate ?? ""} />
        </Field>
        <Field label="End date" error={fe.endDate}>
          <input type="date" name="endDate" defaultValue={defaults.endDate ?? ""} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Home currency" error={fe.homeCurrency}>
          <input
            name="homeCurrency"
            defaultValue={defaults.homeCurrency ?? "EUR"}
            maxLength={3}
            style={{ width: 80 }}
          />
        </Field>
        <Field label="Budget" error={fe.budget}>
          <input name="budget" inputMode="decimal" defaultValue={defaults.budget ?? ""} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Status" error={fe.status}>
          <select name="status" defaultValue={defaults.status ?? "planning"}>
            {tripStatusValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Travel style" error={fe.travelStyle}>
          <select name="travelStyle" defaultValue={defaults.travelStyle ?? ""}>
            <option value="">—</option>
            {travelStyleValues.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes" error={fe.notes}>
        <textarea name="notes" rows={4} defaultValue={defaults.notes ?? ""} />
      </Field>

      {state.error ? <p style={{ color: "crimson" }}>{state.error}</p> : null}
      <button type="submit" disabled={pending} style={{ padding: "0.5rem 1rem" }}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
