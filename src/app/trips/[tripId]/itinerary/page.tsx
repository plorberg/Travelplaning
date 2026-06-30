import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listItinerary } from "@/lib/itinerary";
import { hasAtLeastRole } from "@/lib/authz";
import { detectConflicts } from "@/lib/conflicts";
import { deleteItineraryAction } from "@/app/trips/itinerary-actions";
import { itineraryItemTypeLabels } from "@/lib/labels";
import { formatDate, formatDayHeading, formatTime, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

const MS_PER_DAY = 86_400_000;

// 1-based day index of an ISO day within a trip starting on `startDate`.
function dayNumber(startDate: string | null | undefined, isoDay: string): number | null {
  if (!startDate) return null;
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const day = Date.parse(`${isoDay}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(day)) return null;
  const n = Math.floor((day - start) / MS_PER_DAY) + 1;
  return n >= 1 ? n : null;
}

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
      <li key={it.id} className="list-row" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
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
          {it.savedSpotName || it.documentTitle ? (
            <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>
              {it.savedSpotName ? `📍 ${it.savedSpotName}` : ""}
              {it.savedSpotName && it.documentTitle ? " · " : ""}
              {it.documentTitle ? `🎫 ${it.documentTitle}` : ""}
            </div>
          ) : null}
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

  // Timeline row for the day view: a dot on the rail, time-led, with links.
  function renderTimelineRow(it: Item) {
    const conflicted = conflicts.has(it.id);
    const meta = [it.stopCity, it.location, it.cost ? formatMoney(it.cost, it.currency ?? "") : ""]
      .filter(Boolean)
      .join(" · ");
    return (
      <li key={it.id} style={{ position: "relative", padding: "0 0 1.1rem 1.1rem" }}>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: -6,
            top: 5,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: conflicted ? "#b8860b" : "var(--primary)",
            border: "2px solid var(--surface)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <div style={{ fontVariantNumeric: "tabular-nums", fontSize: "0.85rem", opacity: 0.75 }}>
              {it.startAt
                ? `${formatTime(it.startAt)}${it.endAt ? `–${formatTime(it.endAt)}` : ""}`
                : UNSCHEDULED}
            </div>
            <strong>{it.title}</strong>{" "}
            <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
              · {itineraryItemTypeLabels[it.type] ?? it.type}
            </span>
            {meta ? <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>{meta}</div> : null}
            {it.savedSpotName || it.documentTitle ? (
              <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>
                {it.savedSpotName ? `📍 ${it.savedSpotName}` : ""}
                {it.savedSpotName && it.documentTitle ? " · " : ""}
                {it.documentTitle ? `🎫 ${it.documentTitle}` : ""}
              </div>
            ) : null}
            {conflicted ? (
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
        </div>
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
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← {trip.name}</Link>
      </p>
      <header className="list-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Reiseplan</h1>
        {canEdit ? <Link href={`/trips/${tripId}/itinerary/new`} className="btn btn-primary">+ Eintrag hinzufügen</Link> : null}
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
        <p className="empty">Noch keine Einträge im Reiseplan.</p>
      ) : view === "timeline" ? (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {items.map((it) => renderItem(it, true))}
        </ul>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {groups.map((g) => {
            const n = g.day === UNSCHEDULED ? null : dayNumber(trip.startDate, g.day);
            return (
              <section key={g.day}>
                <h3
                  style={{
                    margin: "0 0 0.6rem",
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                  }}
                >
                  {n ? <span className="badge">Tag {n}</span> : null}
                  <span>{g.day === UNSCHEDULED ? UNSCHEDULED : formatDayHeading(g.day)}</span>
                </h3>
                <ul
                  style={{
                    listStyle: "none",
                    margin: "0 0 0 0.4rem",
                    padding: 0,
                    borderLeft: "2px solid var(--border)",
                  }}
                >
                  {g.items.map((it) => renderTimelineRow(it))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
