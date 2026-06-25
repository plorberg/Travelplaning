import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { itineraryItems, stops, savedSpots, documents } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership } from "@/lib/trips";
import type { ItineraryInput } from "@/lib/validation";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return role;
}

async function requireEditor(userId: string, tripId: string): Promise<void> {
  const role = await requireMember(userId, tripId);
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können den Reiseplan ändern.");
  }
}

// datetime-local has no zone; treat the entered wall time as UTC so it round-trips.
function toDate(value?: string): Date | null {
  return value ? new Date(`${value}:00Z`) : null;
}

type TripRefs = {
  stopIds: Set<string>;
  spotIds: Set<string>;
  docIds: Set<string>;
};

// Valid ids for linkable rows in this trip, so links can't point elsewhere.
async function tripRefs(tripId: string): Promise<TripRefs> {
  const [stopRows, spotRows, docRows] = await Promise.all([
    db.select({ id: stops.id }).from(stops).where(eq(stops.tripId, tripId)),
    db.select({ id: savedSpots.id }).from(savedSpots).where(eq(savedSpots.tripId, tripId)),
    db.select({ id: documents.id }).from(documents).where(eq(documents.tripId, tripId)),
  ]);
  return {
    stopIds: new Set(stopRows.map((r) => r.id)),
    spotIds: new Set(spotRows.map((r) => r.id)),
    docIds: new Set(docRows.map((r) => r.id)),
  };
}

const inSet = (set: Set<string>, id?: string) => (id && set.has(id) ? id : null);

function toRow(refs: TripRefs, input: ItineraryInput) {
  return {
    title: input.title,
    type: input.type,
    stopId: inSet(refs.stopIds, input.stopId),
    savedSpotId: inSet(refs.spotIds, input.savedSpotId),
    documentId: inSet(refs.docIds, input.documentId),
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
      savedSpotName: savedSpots.name,
      documentTitle: documents.title,
      cost: itineraryItems.cost,
      currency: itineraryItems.currency,
      notes: itineraryItems.notes,
    })
    .from(itineraryItems)
    .leftJoin(stops, eq(stops.id, itineraryItems.stopId))
    .leftJoin(savedSpots, eq(savedSpots.id, itineraryItems.savedSpotId))
    .leftJoin(documents, eq(documents.id, itineraryItems.documentId))
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
  const refs = await tripRefs(tripId);
  await db.insert(itineraryItems).values({ tripId, ...toRow(refs, input) });
}

export async function updateItineraryItem(
  userId: string,
  tripId: string,
  itemId: string,
  input: ItineraryInput,
) {
  await requireEditor(userId, tripId);
  const refs = await tripRefs(tripId);
  await db
    .update(itineraryItems)
    .set(toRow(refs, input))
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, tripId)));
}

export async function deleteItineraryItem(userId: string, tripId: string, itemId: string) {
  await requireEditor(userId, tripId);
  await db
    .delete(itineraryItems)
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, tripId)));
}
