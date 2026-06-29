"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/trips/actions";

export function InviteForm({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} style={{ display: "grid", gap: "0.5rem", maxWidth: 460 }}>
      <input name="email" type="email" placeholder="email@example.com" required />
      {fe.email?.length ? (
        <span style={{ color: "crimson", fontSize: "0.8rem" }}>{fe.email[0]}</span>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <select name="role" defaultValue="editor" style={{ flex: "1 1 130px" }}>
          <option value="editor">Bearbeiter</option>
          <option value="viewer">Betrachter</option>
        </select>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Wird eingeladen…" : "Einladen"}
        </button>
      </div>
      {state.error ? <span style={{ color: "crimson" }}>{state.error}</span> : null}
      {state.success ? <span style={{ color: "green" }}>{state.success}</span> : null}
    </form>
  );
}
