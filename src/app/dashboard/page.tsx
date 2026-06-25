import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripsForUser } from "@/lib/trips";
import { listMyInvitations } from "@/lib/invitations";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/app/trips/invite-actions";
import { SignOutButton } from "@/app/_components/SignOutButton";
import { tripStatusLabels, memberRoleLabels } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [trips, invitations] = await Promise.all([
    getTripsForUser(user.id),
    listMyInvitations(user.email),
  ]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <span style={{ opacity: 0.8 }}>Angemeldet als {user.email}</span>
        <SignOutButton />
      </header>

      {invitations.length > 0 ? (
        <section
          style={{
            margin: "1rem 0",
            padding: "0.75rem 1rem",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Offene Einladungen</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
            {invitations.map((inv) => (
              <li
                key={inv.id}
                style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
              >
                <span style={{ minWidth: 260 }}>
                  <strong>{inv.tripName}</strong> · eingeladen als {inv.role}
                </span>
                <form action={acceptInvitationAction.bind(null, inv.id)}>
                  <button type="submit">Annehmen</button>
                </form>
                <form action={declineInvitationAction.bind(null, inv.id)}>
                  <button type="submit">Ablehnen</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h1>Deine Reisen</h1>
        <Link href="/trips/new">+ Neue Reise</Link>
      </div>
      {trips.length === 0 ? (
        <p className="empty">
          Noch keine Reisen.{" "}
          <Link href="/trips/new">Erstelle deine erste Reise</Link>.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={`/trips/${trip.id}`}>
                <strong>{trip.name}</strong>
              </Link>
              {trip.mainDestination ? ` — ${trip.mainDestination}` : ""} ·{" "}
              {tripStatusLabels[trip.status] ?? trip.status} · deine Rolle:{" "}
              {memberRoleLabels[trip.role] ?? trip.role}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
