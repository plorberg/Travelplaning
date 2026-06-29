import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripsForUser } from "@/lib/trips";
import { listMyInvitations } from "@/lib/invitations";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/app/trips/invite-actions";
import { tripStatusLabels, memberRoleLabels } from "@/lib/labels";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [trips, invitations] = await Promise.all([
    getTripsForUser(user.id),
    listMyInvitations(user.email),
  ]);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {invitations.length > 0 ? (
        <section className="card" style={{ margin: "0 0 1.5rem", padding: "0.85rem 1.1rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.05rem" }}>Offene Einladungen</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="list-row"
                style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
              >
                <span style={{ flex: 1 }}>
                  <strong>{inv.tripName}</strong>{" "}
                  <span className="badge">{memberRoleLabels[inv.role] ?? inv.role}</span>
                </span>
                <form action={acceptInvitationAction.bind(null, inv.id)}>
                  <button type="submit" className="btn-primary" style={{ padding: "0.35rem 0.75rem" }}>
                    Annehmen
                  </button>
                </form>
                <form action={declineInvitationAction.bind(null, inv.id)}>
                  <button type="submit" style={{ padding: "0.35rem 0.75rem" }}>Ablehnen</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        className="list-row"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}
      >
        <h1 style={{ margin: 0 }}>Deine Reisen</h1>
        <Link href="/trips/new" className="btn btn-primary">
          + Neue Reise
        </Link>
      </div>

      {trips.length === 0 ? (
        <p className="empty">
          Noch keine Reisen.{" "}
          <Link href="/trips/new">Erstelle deine erste Reise</Link>.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          {trips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} className="card-link">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "1.05rem" }}>{trip.name}</strong>
                <span className="badge">{tripStatusLabels[trip.status] ?? trip.status}</span>
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                {trip.mainDestination || "—"}
                {trip.startDate
                  ? ` · ${formatDate(trip.startDate)}${trip.endDate ? `–${formatDate(trip.endDate)}` : ""}`
                  : ""}
                {` · ${memberRoleLabels[trip.role] ?? trip.role}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
