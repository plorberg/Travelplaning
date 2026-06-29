import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser, listMembers } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { countOwners, hasAtLeastRole } from "@/lib/authz";
import { stopDateWarnings } from "@/lib/dates";
import {
  changeMemberRoleAction,
  deleteTripAction,
  removeMemberAction,
} from "@/app/trips/actions";
import { deleteStopAction, moveStopAction } from "@/app/trips/stop-actions";
import {
  inviteAction,
  revokeInvitationAction,
} from "@/app/trips/invite-actions";
import { listTripInvitations } from "@/lib/invitations";
import { InviteForm } from "@/app/trips/_components/InviteForm";
import {
  tripStatusLabels,
  travelStyleLabels,
  memberRoleLabels,
} from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const ROLES = ["owner", "editor", "viewer"] as const;

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();

  const [members, stops] = await Promise.all([
    listMembers(user.id, tripId),
    listStops(user.id, tripId),
  ]);
  const isOwner = trip.role === "owner";
  const canEdit = hasAtLeastRole(trip.role, "editor");
  const ownerCount = countOwners(members);
  const invitations = isOwner ? await listTripInvitations(user.id, tripId) : [];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>

      <header
        className="list-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>{trip.name}</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {canEdit ? (
            <Link href={`/trips/${tripId}/edit`} className="btn">
              Bearbeiten
            </Link>
          ) : null}
          {isOwner ? (
            <form action={deleteTripAction.bind(null, tripId)}>
              <button type="submit">Reise löschen</button>
            </form>
          ) : null}
        </div>
      </header>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem" }}>
        <dt style={{ opacity: 0.7 }}>Ziel</dt>
        <dd style={{ margin: 0 }}>{trip.mainDestination ?? "—"}</dd>
        <dt style={{ opacity: 0.7 }}>Zeitraum</dt>
        <dd style={{ margin: 0 }}>
          {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
        </dd>
        <dt style={{ opacity: 0.7 }}>Budget</dt>
        <dd style={{ margin: 0 }}>{formatMoney(trip.budget, trip.homeCurrency)}</dd>
        <dt style={{ opacity: 0.7 }}>Status</dt>
        <dd style={{ margin: 0 }}>
          <span className="badge">{tripStatusLabels[trip.status] ?? trip.status}</span>
        </dd>
        <dt style={{ opacity: 0.7 }}>Reisestil</dt>
        <dd style={{ margin: 0 }}>
          {trip.travelStyle
            ? (travelStyleLabels[trip.travelStyle] ?? trip.travelStyle)
            : "—"}
        </dd>
        <dt style={{ opacity: 0.7 }}>Deine Rolle</dt>
        <dd style={{ margin: 0 }}>{memberRoleLabels[trip.role] ?? trip.role}</dd>
      </dl>

      <nav className="nav-grid" style={{ margin: "1.5rem 0" }}>
        <Link href={`/trips/${tripId}/itinerary`} className="nav-card">
          <span className="nav-icon">🗓️</span>
          <span className="nav-label">Reiseplan</span>
        </Link>
        <Link href={`/trips/${tripId}/map`} className="nav-card">
          <span className="nav-icon">🗺️</span>
          <span className="nav-label">Karte</span>
        </Link>
        <Link href={`/trips/${tripId}/flights`} className="nav-card">
          <span className="nav-icon">✈️</span>
          <span className="nav-label">Flüge</span>
        </Link>
        <Link href={`/trips/${tripId}/spots`} className="nav-card">
          <span className="nav-icon">⭐</span>
          <span className="nav-label">Empfehlungen</span>
        </Link>
        <Link href={`/trips/${tripId}/documents`} className="nav-card">
          <span className="nav-icon">📄</span>
          <span className="nav-label">Dokumente</span>
        </Link>
        <Link href={`/trips/${tripId}/expenses`} className="nav-card">
          <span className="nav-icon">💶</span>
          <span className="nav-label">Ausgaben &amp; Budget</span>
        </Link>
      </nav>

      {trip.notes ? (
        <>
          <h2>Notizen</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{trip.notes}</p>
        </>
      ) : null}

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <h2>Stationen</h2>
          {canEdit ? (
            <Link href={`/trips/${tripId}/stops/new`} className="btn btn-primary">+ Station hinzufügen</Link>
          ) : null}
        </div>
        {stops.length === 0 ? (
          <p className="empty">Noch keine Stationen.</p>
        ) : (
          <ol style={{ display: "grid", gap: "0.75rem", paddingLeft: "1.25rem" }}>
            {stops.map((stop, i) => {
              const warnings = stopDateWarnings(trip, stop);
              return (
                <li key={stop.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      alignItems: "flex-start",
                    }}
                  >
                    <div>
                      <strong>
                        {stop.city}
                        {stop.country ? `, ${stop.country}` : ""}
                      </strong>
                      <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                        {formatDate(stop.arrivalDate)} → {formatDate(stop.departureDate)}
                        {stop.accommodationName ? ` · ${stop.accommodationName}` : ""}
                      </div>
                      {warnings.map((w) => (
                        <div key={w} style={{ color: "#b8860b", fontSize: "0.8rem" }}>
                          ⚠ {w}
                        </div>
                      ))}
                    </div>
                    {canEdit ? (
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <form action={moveStopAction.bind(null, tripId, stop.id, "up")}>
                          <button type="submit" disabled={i === 0} title="Nach oben">
                            ↑
                          </button>
                        </form>
                        <form action={moveStopAction.bind(null, tripId, stop.id, "down")}>
                          <button
                            type="submit"
                            disabled={i === stops.length - 1}
                            title="Nach unten"
                          >
                            ↓
                          </button>
                        </form>
                        <Link href={`/trips/${tripId}/stops/${stop.id}/edit`}>
                          Bearbeiten
                        </Link>
                        <form action={deleteStopAction.bind(null, tripId, stop.id)}>
                          <button type="submit">Löschen</button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2>Mitglieder</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
          {members.map((m) => {
            const isLastOwner = m.role === "owner" && ownerCount === 1;
            const manageable = isOwner && !isLastOwner;
            return (
              <li
                key={m.userId}
                style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
              >
                <span style={{ minWidth: 220 }}>
                  {m.name ?? m.email}
                  {m.userId === trip.createdBy ? " · Ersteller" : ""}
                </span>
                {manageable ? (
                  <>
                    <form action={changeMemberRoleAction.bind(null, tripId, m.userId)}>
                      <select name="role" defaultValue={m.role}>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {memberRoleLabels[r] ?? r}
                          </option>
                        ))}
                      </select>{" "}
                      <button type="submit">Speichern</button>
                    </form>
                    <form action={removeMemberAction.bind(null, tripId, m.userId)}>
                      <button type="submit">Entfernen</button>
                    </form>
                  </>
                ) : (
                  <span style={{ opacity: 0.8 }}>
                    {memberRoleLabels[m.role] ?? m.role}
                    {isLastOwner ? " · letzter Eigentümer" : ""}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {isOwner ? (
          <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Jemanden einladen</h3>
            <InviteForm action={inviteAction.bind(null, tripId)} />
            {invitations.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.35rem" }}>
                {invitations.map((inv) => (
                  <li
                    key={inv.id}
                    style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
                  >
                    <span style={{ minWidth: 220 }}>
                      {inv.email} · {memberRoleLabels[inv.role] ?? inv.role} ·
                      ausstehend
                    </span>
                    <form action={revokeInvitationAction.bind(null, tripId, inv.id)}>
                      <button type="submit">Widerrufen</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
