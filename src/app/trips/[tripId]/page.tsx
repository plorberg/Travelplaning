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

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>{trip.name}</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {canEdit ? <Link href={`/trips/${tripId}/edit`}>Edit</Link> : null}
          {isOwner ? (
            <form action={deleteTripAction.bind(null, tripId)}>
              <button type="submit">Delete trip</button>
            </form>
          ) : null}
        </div>
      </header>

      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 1rem" }}>
        <dt style={{ opacity: 0.7 }}>Destination</dt>
        <dd style={{ margin: 0 }}>{trip.mainDestination ?? "—"}</dd>
        <dt style={{ opacity: 0.7 }}>Dates</dt>
        <dd style={{ margin: 0 }}>
          {trip.startDate ?? "—"} → {trip.endDate ?? "—"}
        </dd>
        <dt style={{ opacity: 0.7 }}>Budget</dt>
        <dd style={{ margin: 0 }}>
          {trip.budget ? `${trip.budget} ${trip.homeCurrency}` : "—"}
        </dd>
        <dt style={{ opacity: 0.7 }}>Status</dt>
        <dd style={{ margin: 0 }}>{trip.status}</dd>
        <dt style={{ opacity: 0.7 }}>Travel style</dt>
        <dd style={{ margin: 0 }}>{trip.travelStyle ?? "—"}</dd>
        <dt style={{ opacity: 0.7 }}>Your role</dt>
        <dd style={{ margin: 0 }}>{trip.role}</dd>
      </dl>

      {trip.notes ? (
        <>
          <h2>Notes</h2>
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
          <h2>Stops</h2>
          {canEdit ? <Link href={`/trips/${tripId}/stops/new`}>+ Add stop</Link> : null}
        </div>
        {stops.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No stops yet.</p>
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
                        {stop.arrivalDate ?? "—"} → {stop.departureDate ?? "—"}
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
                          <button type="submit" disabled={i === 0} title="Move up">
                            ↑
                          </button>
                        </form>
                        <form action={moveStopAction.bind(null, tripId, stop.id, "down")}>
                          <button
                            type="submit"
                            disabled={i === stops.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </form>
                        <Link href={`/trips/${tripId}/stops/${stop.id}/edit`}>Edit</Link>
                        <form action={deleteStopAction.bind(null, tripId, stop.id)}>
                          <button type="submit">Delete</button>
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
        <h2>Members</h2>
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
                  {m.userId === trip.createdBy ? " · creator" : ""}
                </span>
                {manageable ? (
                  <>
                    <form action={changeMemberRoleAction.bind(null, tripId, m.userId)}>
                      <select name="role" defaultValue={m.role}>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>{" "}
                      <button type="submit">Save</button>
                    </form>
                    <form action={removeMemberAction.bind(null, tripId, m.userId)}>
                      <button type="submit">Remove</button>
                    </form>
                  </>
                ) : (
                  <span style={{ opacity: 0.8 }}>
                    {m.role}
                    {isLastOwner ? " · last owner" : ""}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {isOwner ? (
          <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>
            Inviting people by email arrives in the collaboration milestone.
          </p>
        ) : null}
      </section>
    </main>
  );
}
