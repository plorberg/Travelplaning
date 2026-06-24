import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { itineraryItems, stops } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership } from "@/lib/trips";
import type { ItineraryInput } from "@/lib/validation";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("You don't have access to this trip.");
  return role;
}

async function requireEditor(userId: string, tripId: string): Promise<void> {
  const role = await requireMember(userId, tripId);
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Only editors or the owner can change the itinerary.");
  }
}

// datetime-local has no zone; treat the entered wall time as UTC so it round-trips.
function toDate(value?: string): Date | null {
  return value ? new Date(`${value}:00Z`) : null;
}

async function tripStopIds(tripId: string): Promise<Set<string>> {
  const rows = await db.select({ id: stops.id }).from(stops).where(eq(stops.tripId, tripId));
  return new Set(rows.map((r) => r.id));
}

function toRow(stopIds: Set<string>, input: ItineraryInput) {
  return {
    title: input.title,
    type: input.type,
    stopId: input.stopId && stopIds.has(input.stopId) ? input.stopId : null,
    startAt: toDate(input.startAt),
    endAt: toDate(input.endAt),
    location: input.location ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    cost: input.cost ?? null,
    currency: input.currency ?? null,
    notes: input.notes ?? null,
  };
}

export async function listItinerary(userId: string, tripId: string) {
  await requireMember(userId, tripId);
  return db
    .select({
      id: itineraryItems.id,
      title: itineraryItems.title,
      type: itineraryItems.type,
      startAt: itineraryItems.startAt,
      endAt: itineraryItems.endAt,
      location: itineraryItems.location,
      stopId: itineraryItems.stopId,
      stopCity: stops.city,
      cost: itineraryItems.cost,
      currency: itineraryItems.currency,
      notes: itineraryItems.notes,
    })
    .from(itineraryItems)
    .leftJoin(stops, eq(stops.id, itineraryItems.stopId))
    .where(eq(itineraryItems.tripId, tripId))
    .orderBy(asc(itineraryItems.startAt), asc(itineraryItems.createdAt));
}

export async function getItineraryItem(userId: string, tripId: string, itemId: string) {
  await requireMember(userId, tripId);
  const [row] = await db
    .select()
    .from(itineraryItems)
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, tripId)))
    .limit(1);
  return row ?? null;
}

export async function createItineraryItem(userId: string, tripId: string, input: ItineraryInput) {
  await requireEditor(userId, tripId);
  const stopIds = await tripStopIds(tripId);
  await db.insert(itineraryItems).values({ tripId, ...toRow(stopIds, input) });
}

export async function updateItineraryItem(
  userId: string,
  tripId: string,
  itemId: string,
  input: ItineraryInput,
) {
  await requireEditor(userId, tripId);
  const stopIds = await tripStopIds(tripId);
  await db
    .update(itineraryItems)
    .set(toRow(stopIds, input))
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, tripId)));
}

export async function deleteItineraryItem(userId: string, tripId: string, itemId: string) {
  await requireEditor(userId, tripId);
  await db
    .delete(itineraryItems)
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, tripId)));
}
