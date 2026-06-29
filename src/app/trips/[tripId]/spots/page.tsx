import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listSavedSpots } from "@/lib/saved-spots";
import { hasAtLeastRole } from "@/lib/authz";
import { spotCategoryLabels } from "@/lib/labels";
import { deleteSpotAction } from "@/app/trips/spot-actions";

export const dynamic = "force-dynamic";

export default async function SpotsPage({
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

  const spots = await listSavedSpots(user.id, tripId);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← {trip.name}</Link>
      </p>
      <header className="list-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Empfehlungen</h1>
        {canEdit ? <Link href={`/trips/${tripId}/spots/new`} className="btn btn-primary">+ Empfehlung hinzufügen</Link> : null}
      </header>

      {spots.length === 0 ? (
        <p className="empty">Noch keine Empfehlungen.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          {spots.map((s) => (
            <li key={s.id} className="list-row" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <strong>{s.name}</strong>
                {s.category ? (
                  <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                    {" "}
                    · {spotCategoryLabels[s.category] ?? s.category}
                  </span>
                ) : null}
                <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                  {s.rating ? `★ ${s.rating}` : ""}
                  {s.recommendedDurationMinutes ? `${s.rating ? " · " : ""}${s.recommendedDurationMinutes} Min.` : ""}
                  {s.stopCity ? ` · ${s.stopCity}` : ""}
                  {s.address ? ` · ${s.address}` : ""}
                </div>
                {s.notes ? <div style={{ fontSize: "0.85rem" }}>{s.notes}</div> : null}
                {s.source ? (
                  <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>Quelle: {s.source}</div>
                ) : null}
              </div>
              {canEdit ? (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <Link href={`/trips/${tripId}/spots/${s.id}/edit`}>Bearbeiten</Link>
                  <form action={deleteSpotAction.bind(null, tripId, s.id)}>
                    <button type="submit">Löschen</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
