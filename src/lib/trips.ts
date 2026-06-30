import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  trips,
  tripMembers,
  users,
  itineraryItems,
  documents,
  savedSpots,
  expenses,
} from "@/db/schema";
import {
  checkRemoveMember,
  checkRoleChange,
  hasAtLeastRole,
  type Role,
} from "@/lib/authz";
import type { TripInput } from "@/lib/validation";

/** Thrown when a user lacks the required role for an action. */
export class AccessError extends Error {}

/**
 * Authorization rule (non-negotiable): every trip-scoped read/write is filtered
 * by `trip_members`. A user only ever sees or mutates trips they belong to.
 * This membership lookup is the single source of truth — never trust the client.
 */
export async function getMembership(
  userId: string,
  tripId: string,
): Promise<Role | null> {
  const [row] = await db
    .select({ role: tripMembers.role })
    .from(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}

export async function getTripsForUser(userId: string) {
  return db
    .select({
      id: trips.id,
      name: trips.name,
      mainDestination: trips.mainDestination,
      startDate: trips.startDate,
      endDate: trips.endDate,
      status: trips.status,
      budget: trips.budget,
      homeCurrency: trips.homeCurrency,
      role: tripMembers.role,
    })
    .from(trips)
    .innerJoin(tripMembers, eq(tripMembers.tripId, trips.id))
    .where(eq(tripMembers.userId, userId))
    .orderBy(trips.createdAt);
}

/** Returns the trip plus the caller's role, or null if they are not a member. */
export async function getTripForUser(userId: string, tripId: string) {
  const [row] = await db
    .select({
      id: trips.id,
      name: trips.name,
      mainDestination: trips.mainDestination,
      destinationCountry: trips.destinationCountry,
      startDate: trips.startDate,
      endDate: trips.endDate,
      homeCurrency: trips.homeCurrency,
      budget: trips.budget,
      status: trips.status,
      travelStyle: trips.travelStyle,
      notes: trips.notes,
      createdBy: trips.createdBy,
      role: tripMembers.role,
    })
    .from(trips)
    .innerJoin(tripMembers, eq(tripMembers.tripId, trips.id))
    .where(and(eq(trips.id, tripId), eq(tripMembers.userId, userId)))
    .limit(1);
  return row ?? null;
}

/** Per-section item counts for the trip overview (membership-checked). */
export async function getTripCounts(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  const [it, doc, sp, ex] = await Promise.all([
    db.select({ c: count() }).from(itineraryItems).where(eq(itineraryItems.tripId, tripId)),
    db.select({ c: count() }).from(documents).where(eq(documents.tripId, tripId)),
    db.select({ c: count() }).from(savedSpots).where(eq(savedSpots.tripId, tripId)),
    db.select({ c: count() }).from(expenses).where(eq(expenses.tripId, tripId)),
  ]);
  return {
    itinerary: it[0]?.c ?? 0,
    documents: doc[0]?.c ?? 0,
    spots: sp[0]?.c ?? 0,
    expenses: ex[0]?.c ?? 0,
  };
}

function toRow(input: TripInput) {
  return {
    name: input.name,
    mainDestination: input.mainDestination ?? null,
    destinationCountry: input.destinationCountry ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    homeCurrency: input.homeCurrency,
    budget: input.budget ?? null,
    status: input.status,
    travelStyle: input.travelStyle ?? null,
    notes: input.notes ?? null,
  };
}

/** Creates a trip and its owner membership atomically; returns the trip id. */
export async function createTrip(
  userId: string,
  input: TripInput,
): Promise<string> {
  const id = crypto.randomUUID();
  await db.batch([
    db.insert(trips).values({ id, ...toRow(input), createdBy: userId }),
    db.insert(tripMembers).values({ tripId: id, userId, role: "owner" }),
  ]);
  return id;
}

export async function updateTrip(
  userId: string,
  tripId: string,
  input: TripInput,
): Promise<void> {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können diese Reise bearbeiten.");
  }
  await db
    .update(trips)
    .set({ ...toRow(input), updatedAt: new Date() })
    .where(eq(trips.id, tripId));
}

export async function deleteTrip(userId: string, tripId: string): Promise<void> {
  const role = await getMembership(userId, tripId);
  if (role !== "owner") {
    throw new AccessError("Nur der Eigentümer kann eine Reise löschen.");
  }
  // Members, stops, documents, etc. cascade via FK on delete.
  await db.delete(trips).where(eq(trips.id, tripId));
}

export async function listMembers(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return db
    .select({
      userId: tripMembers.userId,
      role: tripMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(tripMembers)
    .innerJoin(users, eq(users.id, tripMembers.userId))
    .where(eq(tripMembers.tripId, tripId))
    .orderBy(tripMembers.createdAt);
}

function membersForGuard(tripId: string) {
  return db
    .select({ userId: tripMembers.userId, role: tripMembers.role })
    .from(tripMembers)
    .where(eq(tripMembers.tripId, tripId));
}

export async function changeMemberRole(
  userId: string,
  tripId: string,
  targetUserId: string,
  newRole: Role,
): Promise<void> {
  const role = await getMembership(userId, tripId);
  if (role !== "owner") {
    throw new AccessError("Nur der Eigentümer kann Rollen ändern.");
  }
  const problem = checkRoleChange(await membersForGuard(tripId), targetUserId, newRole);
  if (problem) throw new AccessError(problem);
  await db
    .update(tripMembers)
    .set({ role: newRole })
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, targetUserId)));
}

export async function removeMember(
  userId: string,
  tripId: string,
  targetUserId: string,
): Promise<void> {
  const role = await getMembership(userId, tripId);
  if (role !== "owner") {
    throw new AccessError("Nur der Eigentümer kann Mitglieder entfernen.");
  }
  const problem = checkRemoveMember(await membersForGuard(tripId), targetUserId);
  if (problem) throw new AccessError(problem);
  await db
    .delete(tripMembers)
    .where(and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, targetUserId)));
}
