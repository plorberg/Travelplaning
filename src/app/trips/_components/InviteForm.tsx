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
    <form
      action={formAction}
      style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", flexWrap: "wrap" }}
    >
      <div style={{ display: "grid", gap: "0.2rem" }}>
        <input name="email" type="email" placeholder="email@example.com" required />
        {fe.email?.length ? (
          <span style={{ color: "crimson", fontSize: "0.8rem" }}>{fe.email[0]}</span>
        ) : null}
      </div>
      <select name="role" defaultValue="editor">
        <option value="editor">editor</option>
        <option value="viewer">viewer</option>
      </select>
      <button type="submit" disabled={pending}>
        {pending ? "Inviting…" : "Invite"}
      </button>
      {state.error ? <span style={{ color: "crimson" }}>{state.error}</span> : null}
      {state.success ? <span style={{ color: "green" }}>{state.success}</span> : null}
    </form>
  );
}
