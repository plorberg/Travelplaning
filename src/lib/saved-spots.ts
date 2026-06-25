import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { savedSpots, stops } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership } from "@/lib/trips";
import type { SpotInput } from "@/lib/validation";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return role;
}

async function requireEditor(userId: string, tripId: string): Promise<void> {
  const role = await requireMember(userId, tripId);
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können Orte ändern.");
  }
}

async function tripStopIds(tripId: string): Promise<Set<string>> {
  const rows = await db.select({ id: stops.id }).from(stops).where(eq(stops.tripId, tripId));
  return new Set(rows.map((r) => r.id));
}

function toRow(stopIds: Set<string>, input: SpotInput) {
  return {
    name: input.name,
    category: input.category ?? null,
    stopId: input.stopId && stopIds.has(input.stopId) ? input.stopId : null,
    address: input.address ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    rating: input.rating ?? null,
    source: input.source ?? null,
    recommendedDurationMinutes: input.recommendedDurationMinutes ?? null,
    notes: input.notes ?? null,
  };
}

export async function listSavedSpots(userId: string, tripId: string) {
  await requireMember(userId, tripId);
  return db
    .select({
      id: savedSpots.id,
      name: savedSpots.name,
      category: savedSpots.category,
      address: savedSpots.address,
      rating: savedSpots.rating,
      source: savedSpots.source,
      recommendedDurationMinutes: savedSpots.recommendedDurationMinutes,
      notes: savedSpots.notes,
      stopId: savedSpots.stopId,
      stopCity: stops.city,
    })
    .from(savedSpots)
    .leftJoin(stops, eq(stops.id, savedSpots.stopId))
    .where(eq(savedSpots.tripId, tripId))
    .orderBy(asc(savedSpots.name));
}

export async function getSavedSpot(userId: string, tripId: string, spotId: string) {
  await requireMember(userId, tripId);
  const [row] = await db
    .select()
    .from(savedSpots)
    .where(and(eq(savedSpots.id, spotId), eq(savedSpots.tripId, tripId)))
    .limit(1);
  return row ?? null;
}

export async function createSavedSpot(userId: string, tripId: string, input: SpotInput) {
  await requireEditor(userId, tripId);
  const stopIds = await tripStopIds(tripId);
  await db.insert(savedSpots).values({ tripId, ...toRow(stopIds, input), createdBy: userId });
}

export async function updateSavedSpot(
  userId: string,
  tripId: string,
  spotId: string,
  input: SpotInput,
) {
  await requireEditor(userId, tripId);
  const stopIds = await tripStopIds(tripId);
  await db
    .update(savedSpots)
    .set(toRow(stopIds, input))
    .where(and(eq(savedSpots.id, spotId), eq(savedSpots.tripId, tripId)));
}

export async function deleteSavedSpot(userId: string, tripId: string, spotId: string) {
  await requireEditor(userId, tripId);
  await db
    .delete(savedSpots)
    .where(and(eq(savedSpots.id, spotId), eq(savedSpots.tripId, tripId)));
}
