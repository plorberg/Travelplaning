import { eq } from "drizzle-orm";
import { db } from "@/db";
import { trips, tripMembers } from "@/db/schema";

/**
 * Authorization rule (non-negotiable): every trip-scoped read is filtered by
 * `trip_members`. A user only ever sees trips they are a member of. This join
 * is the single source of truth for access — never trust the client.
 */
export async function getTripsForUser(userId: string) {
  return db
    .select({
      id: trips.id,
      name: trips.name,
      mainDestination: trips.mainDestination,
      startDate: trips.startDate,
      endDate: trips.endDate,
      status: trips.status,
      role: tripMembers.role,
    })
    .from(trips)
    .innerJoin(tripMembers, eq(tripMembers.tripId, trips.id))
    .where(eq(tripMembers.userId, userId))
    .orderBy(trips.createdAt);
}
