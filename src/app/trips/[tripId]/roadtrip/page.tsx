import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { hasAtLeastRole } from "@/lib/authz";
import { recomputeLegsAction } from "@/app/trips/stop-actions";
import { formatDate, formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.6rem",
  borderBottom: "2px solid var(--border-strong)",
  whiteSpace: "nowrap",
  fontSize: "0.8rem",
};
const td: React.CSSProperties = {
  padding: "0.5rem 0.6rem",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
  fontSize: "0.88rem",
};

export default async function RoadtripPage({
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

  const stops = await listStops(user.id, tripId);
  const totalKm = stops.reduce((s, st) => s + (st.legDistanceKm ? Number(st.legDistanceKm) : 0), 0);
  const totalMin = stops.reduce((s, st) => s + (st.legDriveMinutes ?? 0), 0);
  const hasCoordPairs = stops.some(
    (st, i) => i > 0 && st.lat != null && st.lng != null && stops[i - 1].lat != null && stops[i - 1].lng != null,
  );

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← {trip.name}</Link>
      </p>
      <header
        className="list-row"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
      >
        <h1 style={{ margin: 0 }}>Route &amp; Etappen</h1>
        {canEdit && hasCoordPairs ? (
          <form action={recomputeLegsAction.bind(null, tripId)}>
            <button type="submit" className="btn">Strecken berechnen</button>
          </form>
        ) : null}
      </header>

      {stops.length === 0 ? (
        <p className="empty">
          Noch keine Stationen.{" "}
          <Link href={`/trips/${tripId}/stops/new`}>Füge die erste Station hinzu</Link>.
        </p>
      ) : (
        <>
          {stops.length > 0 && totalKm === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {hasCoordPairs
                ? 'Tipp: „Strecken berechnen" füllt Fahrstrecke und Fahrzeit automatisch (über Straße).'
                : "Hinterlege Koordinaten an den Stationen, damit Fahrstrecke und Fahrzeit berechnet werden können."}
            </p>
          ) : null}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={th}>Tag</th>
                  <th style={th}>Datum</th>
                  <th style={th}>Von → Nach</th>
                  <th style={{ ...th, textAlign: "right" }}>Strecke</th>
                  <th style={{ ...th, textAlign: "right" }}>Fahrzeit</th>
                  <th style={th}>Schwerpunkte</th>
                  <th style={th}>Übernachtung</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((st, i) => {
                  const prev = i > 0 ? stops[i - 1] : null;
                  return (
                    <tr key={st.id}>
                      <td style={{ ...td, textAlign: "right" }}>{i + 1}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>{formatDate(st.arrivalDate)}</td>
                      <td style={td}>
                        <strong>{prev ? prev.city : "Start"}</strong> → <strong>{st.city}</strong>
                      </td>
                      <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                        {st.legDistanceKm ? `${Number(st.legDistanceKm).toFixed(0)} km` : "—"}
                      </td>
                      <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                        {st.legDriveMinutes != null ? formatDuration(st.legDriveMinutes) : "—"}
                      </td>
                      <td style={td}>{st.highlights || "—"}</td>
                      <td style={td}>{st.accommodationName || st.city}</td>
                    </tr>
                  );
                })}
              </tbody>
              {totalKm > 0 ? (
                <tfoot>
                  <tr>
                    <td style={{ ...td, fontWeight: 700 }} colSpan={3}>
                      Gesamt
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {totalKm.toFixed(0)} km
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {formatDuration(totalMin)}
                    </td>
                    <td style={td} colSpan={2} />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
            Strecke und Fahrzeit per OpenStreetMap-Routing (OSRM); ohne Route wird die
            Luftlinie angezeigt. Schwerpunkte &amp; Übernachtung pflegst du an der jeweiligen
            Station.
          </p>
        </>
      )}
    </main>
  );
}
