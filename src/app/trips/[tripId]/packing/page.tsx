import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listPackingItems } from "@/lib/packing";
import { hasAtLeastRole } from "@/lib/authz";
import {
  addPackingItemAction,
  deletePackingItemAction,
  togglePackingItemAction,
} from "@/app/trips/packing-actions";

export const dynamic = "force-dynamic";

export default async function PackingPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  const canEdit = hasAtLeastRole(trip.role, "editor");

  const items = await listPackingItems(user.id, tripId);
  const open = items.filter((i) => !i.done).length;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← {trip.name}</Link>
      </p>
      <h1>Packliste</h1>
      <p style={{ color: "var(--muted)", marginTop: "0.25rem" }}>
        {items.length === 0
          ? "Noch keine Einträge."
          : open === 0
            ? `Alles gepackt — ${items.length} ${items.length === 1 ? "Eintrag" : "Einträge"} ✅`
            : `${open} von ${items.length} noch offen`}
      </p>

      {canEdit ? (
        <form
          action={addPackingItemAction.bind(null, tripId)}
          style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}
        >
          <input
            name="name"
            placeholder="z. B. Reisepass, Ladekabel, Sonnencreme…"
            maxLength={200}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary">Hinzufügen</button>
        </form>
      ) : null}

      {items.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.4rem" }}>
          {items.map((item) => (
            <li
              key={item.id}
              className="card list-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.45rem 0.75rem",
              }}
            >
              {canEdit ? (
                <form action={togglePackingItemAction.bind(null, tripId, item.id)}>
                  <button
                    type="submit"
                    aria-label={item.done ? `„${item.name}" als offen markieren` : `„${item.name}" abhaken`}
                    style={{ padding: "0.2rem 0.5rem", lineHeight: 1 }}
                  >
                    {item.done ? "☑" : "☐"}
                  </button>
                </form>
              ) : (
                <span aria-hidden="true">{item.done ? "☑" : "☐"}</span>
              )}
              <span
                style={{
                  flex: 1,
                  textDecoration: item.done ? "line-through" : "none",
                  color: item.done ? "var(--muted)" : "inherit",
                }}
              >
                {item.name}
              </span>
              {canEdit ? (
                <form action={deletePackingItemAction.bind(null, tripId, item.id)}>
                  <button
                    type="submit"
                    aria-label={`„${item.name}" entfernen`}
                    style={{ padding: "0.2rem 0.5rem", lineHeight: 1 }}
                  >
                    ✕
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
