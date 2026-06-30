import { and, eq, max as maxFn } from "drizzle-orm";
import { db } from "@/db";
import { stops } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership } from "@/lib/trips";
import { routeLeg } from "@/lib/routing";
import type { StopInput } from "@/lib/validation";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return role;
}

async function requireEditor(userId: string, tripId: string): Promise<void> {
  const role = await requireMember(userId, tripId);
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können Stationen ändern.");
  }
}

function toStopRow(input: StopInput) {
  return {
    city: input.city,
    country: input.country ?? null,
    arrivalDate: input.arrivalDate ?? null,
    departureDate: input.departureDate ?? null,
    accommodationName: input.accommodationName ?? null,
    accommodationAddress: input.accommodationAddress ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    notes: input.notes ?? null,
    highlights: input.highlights ?? null,
  };
}

export async function listStops(userId: string, tripId: string) {
  await requireMember(userId, tripId);
  return db
    .select()
    .from(stops)
    .where(eq(stops.tripId, tripId))
    .orderBy(stops.sortOrder, stops.createdAt);
}

export async function getStop(userId: string, tripId: string, stopId: string) {
  await requireMember(userId, tripId);
  const [row] = await db
    .select()
    .from(stops)
    .where(and(eq(stops.id, stopId), eq(stops.tripId, tripId)))
    .limit(1);
  return row ?? null;
}

export async function createStop(
  userId: string,
  tripId: string,
  input: StopInput,
): Promise<void> {
  await requireEditor(userId, tripId);
  // Append to the end of the current order.
  const [agg] = await db
    .select({ m: maxFn(stops.sortOrder) })
    .from(stops)
    .where(eq(stops.tripId, tripId));
  const nextOrder = (agg?.m ?? -1) + 1;
  await db.insert(stops).values({ tripId, ...toStopRow(input), sortOrder: nextOrder });
}

export async function updateStop(
  userId: string,
  tripId: string,
  stopId: string,
  input: StopInput,
): Promise<void> {
  await requireEditor(userId, tripId);
  await db
    .update(stops)
    .set(toStopRow(input))
    .where(and(eq(stops.id, stopId), eq(stops.tripId, tripId)));
}

export async function deleteStop(
  userId: string,
  tripId: string,
  stopId: string,
): Promise<void> {
  await requireEditor(userId, tripId);
  await db
    .delete(stops)
    .where(and(eq(stops.id, stopId), eq(stops.tripId, tripId)));
}

/** Swaps a stop's order with its neighbour in the given direction. */
export async function moveStop(
  userId: string,
  tripId: string,
  stopId: string,
  direction: "up" | "down",
): Promise<void> {
  await requireEditor(userId, tripId);
  const rows = await db
    .select({ id: stops.id, sortOrder: stops.sortOrder })
    .from(stops)
    .where(eq(stops.tripId, tripId))
    .orderBy(stops.sortOrder, stops.createdAt);

  const idx = rows.findIndex((r) => r.id === stopId);
  if (idx === -1) throw new AccessError("Station nicht gefunden.");
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return; // already at the edge

  const a = rows[idx];
  const b = rows[swapIdx];
  await db.batch([
    db.update(stops).set({ sortOrder: b.sortOrder }).where(eq(stops.id, a.id)),
    db.update(stops).set({ sortOrder: a.sortOrder }).where(eq(stops.id, b.id)),
  ]);
}

/**
 * Recomputes the driving leg (distance + time) from each stop to the next via
 * the routing provider and caches it on the destination stop. Legs without
 * coordinates on both ends (and the first stop) are cleared to null.
 */
export async function recomputeLegs(userId: string, tripId: string): Promise<number> {
  await requireEditor(userId, tripId);
  const ordered = await db
    .select()
    .from(stops)
    .where(eq(stops.tripId, tripId))
    .orderBy(stops.sortOrder, stops.createdAt);

  for (let i = 0; i < ordered.length; i++) {
    const cur = ordered[i];
    const prev = i > 0 ? ordered[i - 1] : null;
    let distance: string | null = null;
    let minutes: number | null = null;
    if (prev?.lat != null && prev.lng != null && cur.lat != null && cur.lng != null) {
      const r = await routeLeg(
        { lat: prev.lat, lng: prev.lng },
        { lat: cur.lat, lng: cur.lng },
      );
      distance = r.distanceKm.toFixed(1);
      minutes = r.durationMinutes;
    }
    await db
      .update(stops)
      .set({ legDistanceKm: distance, legDriveMinutes: minutes })
      .where(eq(stops.id, cur.id));
  }
  return ordered.length;
}
