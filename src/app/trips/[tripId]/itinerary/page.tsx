import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listItinerary } from "@/lib/itinerary";
import { hasAtLeastRole } from "@/lib/authz";
import { detectConflicts } from "@/lib/conflicts";
import { deleteItineraryAction } from "@/app/trips/itinerary-actions";

export const dynamic = "force-dynamic";

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

  const time = (dt: Date) => dt.toISOString().slice(11, 16);
  const day = (dt: Date) => dt.toISOString().slice(0, 10);

  function renderItem(it: Item, showDate: boolean) {
    return (
      <li key={it.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <strong>{it.title}</strong>{" "}
          <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>· {it.type}</span>
          <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
            {it.startAt
              ? `${showDate ? `${day(it.startAt)} ` : ""}${time(it.startAt)}${it.endAt ? `–${time(it.endAt)}` : ""}`
              : "Unscheduled"}
            {it.stopCity ? ` · ${it.stopCity}` : ""}
            {it.location ? ` · ${it.location}` : ""}
            {it.cost ? ` · ${it.cost} ${it.currency ?? ""}` : ""}
          </div>
          {conflicts.has(it.id) ? (
            <div style={{ color: "#b8860b", fontSize: "0.8rem" }}>⚠ Overlaps another item</div>
          ) : null}
          {it.notes ? <div style={{ fontSize: "0.85rem" }}>{it.notes}</div> : null}
        </div>
        {canEdit ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <Link href={`/trips/${tripId}/itinerary/${it.id}/edit`}>Edit</Link>
            <form action={deleteItineraryAction.bind(null, tripId, it.id)}>
              <button type="submit">Delete</button>
            </form>
          </div>
        ) : null}
      </li>
    );
  }

  // Group consecutive items by day (already sorted; nulls/unscheduled last).
  const groups: { day: string; items: Item[] }[] = [];
  for (const it of items) {
    const key = it.startAt ? day(it.startAt) : "Unscheduled";
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
        <h1 style={{ margin: 0 }}>Itinerary</h1>
        {canEdit ? <Link href={`/trips/${tripId}/itinerary/new`}>+ Add item</Link> : null}
      </header>

      <p style={{ display: "flex", gap: "1rem", margin: "0.5rem 0 1rem" }}>
        <Link href={`/trips/${tripId}/itinerary`} style={{ fontWeight: view === "days" ? 700 : 400 }}>
          Day-by-day
        </Link>
        <Link href={`/trips/${tripId}/itinerary?view=timeline`} style={{ fontWeight: view === "timeline" ? 700 : 400 }}>
          Timeline
        </Link>
      </p>

      {items.length === 0 ? (
        <p style={{ opacity: 0.8 }}>No itinerary items yet.</p>
      ) : view === "timeline" ? (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {items.map((it) => renderItem(it, true))}
        </ul>
      ) : (
        <div style={{ display: "grid", gap: "1.25rem" }}>
          {groups.map((g) => (
            <section key={g.day}>
              <h3 style={{ margin: "0 0 0.4rem" }}>{g.day}</h3>
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
