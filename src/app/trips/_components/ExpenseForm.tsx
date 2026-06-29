"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/trips/actions";
import { expenseCategoryValues } from "@/lib/validation";
import { expenseCategoryLabels } from "@/lib/labels";

type Defaults = {
  stopId?: string;
  date?: string;
  category?: string;
  amount?: string;
  currency?: string;
  manualRate?: string;
  paymentMethod?: string;
  paidBy?: string;
  splitWith?: string[];
  notes?: string;
  receiptUrl?: string;
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

export function ExpenseForm({
  action,
  defaults = {},
  submitLabel,
  stops,
  members,
  homeCurrency,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: Defaults;
  submitLabel: string;
  stops: { id: string; city: string }[];
  members: { id: string; label: string }[];
  homeCurrency: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};
  const split = new Set(defaults.splitWith ?? []);

  return (
    <form
      action={formAction}
      style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}
    >
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Datum" error={fe.date}>
          <input type="date" name="date" defaultValue={defaults.date ?? ""} required />
        </Field>
        <Field label="Kategorie" error={fe.category}>
          <select name="category" defaultValue={defaults.category ?? "food"}>
            {expenseCategoryValues.map((c) => (
              <option key={c} value={c}>
                {expenseCategoryLabels[c] ?? c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Betrag" error={fe.amount}>
          <input name="amount" inputMode="decimal" defaultValue={defaults.amount ?? ""} required />
        </Field>
        <Field label="Währung" error={fe.currency}>
          <input
            name="currency"
            maxLength={3}
            defaultValue={defaults.currency ?? homeCurrency}
            style={{ width: 80 }}
          />
        </Field>
      </div>
      <Field
        label={`Manueller Kurs (1 Einheit → ${homeCurrency}; leer = automatisch umrechnen)`}
        error={fe.manualRate}
      >
        <input name="manualRate" inputMode="decimal" defaultValue={defaults.manualRate ?? ""} />
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
      <div className="field-row" style={{ display: "flex", gap: "0.75rem" }}>
        <Field label="Zahlungsmethode" error={fe.paymentMethod}>
          <input name="paymentMethod" defaultValue={defaults.paymentMethod ?? ""} />
        </Field>
        <Field label="Bezahlt von" error={fe.paidBy}>
          <select name="paidBy" defaultValue={defaults.paidBy ?? ""}>
            <option value="">— niemand —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {members.length > 0 ? (
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 6, display: "grid", gap: "0.25rem" }}>
          <legend style={{ fontSize: "0.8rem", opacity: 0.8 }}>Aufteilen mit</legend>
          {members.map((m) => (
            <label key={m.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="checkbox"
                name="splitWith"
                value={m.id}
                defaultChecked={split.has(m.id)}
              />
              {m.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      <Field label="Beleg-URL" error={fe.receiptUrl}>
        <input name="receiptUrl" inputMode="url" defaultValue={defaults.receiptUrl ?? ""} />
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
