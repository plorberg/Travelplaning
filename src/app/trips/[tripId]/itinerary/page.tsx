import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listItinerary } from "@/lib/itinerary";
import { hasAtLeastRole } from "@/lib/authz";
import { detectConflicts } from "@/lib/conflicts";
import { deleteItineraryAction } from "@/app/trips/itinerary-actions";
import { itineraryItemTypeLabels } from "@/lib/labels";
import { formatDate, formatTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const UNSCHEDULED = "Nicht geplant";

type Item = Awaited<ReturnType<typeof listItinerary>>[number];

export default async function ItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tripId } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  const canEdit = hasAtLeastRole(trip.role, "editor");

  const items = await listItinerary(user.id, tripId);
  const conflicts = detectConflicts(
    items.map((i) => ({ id: i.id, startAt: i.startAt, endAt: i.endAt })),
  );
  const view = sp.view === "timeline" ? "timeline" : "days";

  // ISO day used only as a stable grouping key; headings render it via formatDate.
  const dayKey = (dt: Date) => dt.toISOString().slice(0, 10);

  function renderItem(it: Item, showDate: boolean) {
    return (
      <li key={it.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <strong>{it.title}</strong>{" "}
          <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
            · {itineraryItemTypeLabels[it.type] ?? it.type}
          </span>
          <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
            {it.startAt
              ? `${showDate ? `${formatDate(it.startAt)} ` : ""}${formatTime(it.startAt)}${it.endAt ? `–${formatTime(it.endAt)}` : ""}`
              : UNSCHEDULED}
            {it.stopCity ? ` · ${it.stopCity}` : ""}
            {it.location ? ` · ${it.location}` : ""}
            {it.cost ? ` · ${formatMoney(it.cost, it.currency ?? "")}` : ""}
          </div>
          {conflicts.has(it.id) ? (
            <div style={{ color: "#b8860b", fontSize: "0.8rem" }}>
              ⚠ Überschneidet sich mit einem anderen Eintrag
            </div>
          ) : null}
          {it.notes ? <div style={{ fontSize: "0.85rem" }}>{it.notes}</div> : null}
        </div>
        {canEdit ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <Link href={`/trips/${tripId}/itinerary/${it.id}/edit`}>Bearbeiten</Link>
            <form action={deleteItineraryAction.bind(null, tripId, it.id)}>
              <button type="submit">Löschen</button>
            </form>
          </div>
        ) : null}
      </li>
    );
  }

  // Group consecutive items by day (already sorted; nulls/unscheduled last).
  const groups: { day: string; items: Item[] }[] = [];
  for (const it of items) {
    const key = it.startAt ? dayKey(it.startAt) : UNSCHEDULED;
    const last = groups[groups.length - 1];
    if (last && last.day === key) last.items.push(it);
    else groups.push({ day: key, items: [it] });
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← {trip.name}</Link>
      </p>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Reiseplan</h1>
        {canEdit ? <Link href={`/trips/${tripId}/itinerary/new`}>+ Eintrag hinzufügen</Link> : null}
      </header>

      <p style={{ display: "flex", gap: "1rem", margin: "0.5rem 0 1rem" }}>
        <Link href={`/trips/${tripId}/itinerary`} style={{ fontWeight: view === "days" ? 700 : 400 }}>
          Tag für Tag
        </Link>
        <Link href={`/trips/${tripId}/itinerary?view=timeline`} style={{ fontWeight: view === "timeline" ? 700 : 400 }}>
          Zeitstrahl
        </Link>
      </p>

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>Noch keine Einträge im Reiseplan.</p>
      ) : view === "timeline" ? (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {items.map((it) => renderItem(it, true))}
        </ul>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {groups.map((g) => (
            <section key={g.day}>
              <h3 style={{ margin: "0 0 0.4rem" }}>
                {g.day === UNSCHEDULED ? UNSCHEDULED : formatDate(g.day)}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.5rem" }}>
                {g.items.map((it) => renderItem(it, false))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
