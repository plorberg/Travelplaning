import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tripInvitations, tripMembers, trips, users } from "@/db/schema";
import { AccessError, getMembership } from "@/lib/trips";
import { canRespond, normalizeEmail, type InvitableRole } from "@/lib/invite-rules";

async function requireOwner(userId: string, tripId: string): Promise<void> {
  const role = await getMembership(userId, tripId);
  if (role !== "owner") {
    throw new AccessError("Nur der Eigentümer kann Einladungen verwalten.");
  }
}

export async function listTripInvitations(userId: string, tripId: string) {
  await requireOwner(userId, tripId);
  return db
    .select({
      id: tripInvitations.id,
      email: tripInvitations.email,
      role: tripInvitations.role,
      createdAt: tripInvitations.createdAt,
    })
    .from(tripInvitations)
    .where(
      and(
        eq(tripInvitations.tripId, tripId),
        eq(tripInvitations.status, "pending"),
      ),
    )
    .orderBy(tripInvitations.createdAt);
}

export async function inviteToTrip(
  userId: string,
  tripId: string,
  emailRaw: string,
  role: InvitableRole,
): Promise<void> {
  await requireOwner(userId, tripId);
  const email = normalizeEmail(emailRaw);

  // If a user with that email already exists, make sure they aren't a member.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser) {
    const [member] = await db
      .select({ id: tripMembers.id })
      .from(tripMembers)
      .where(
        and(
          eq(tripMembers.tripId, tripId),
          eq(tripMembers.userId, existingUser.id),
        ),
      )
      .limit(1);
    if (member) {
      throw new AccessError("Diese Person ist bereits Mitglied dieser Reise.");
    }
  }

  const [pending] = await db
    .select({ id: tripInvitations.id })
    .from(tripInvitations)
    .where(
      and(
        eq(tripInvitations.tripId, tripId),
        eq(tripInvitations.email, email),
        eq(tripInvitations.status, "pending"),
      ),
    )
    .limit(1);
  if (pending) {
    throw new AccessError("Für diese E-Mail-Adresse gibt es bereits eine offene Einladung.");
  }

  await db
    .insert(tripInvitations)
    .values({ tripId, email, role, invitedBy: userId });
}

export async function revokeInvitation(
  userId: string,
  tripId: string,
  invitationId: string,
): Promise<void> {
  await requireOwner(userId, tripId);
  await db
    .delete(tripInvitations)
    .where(
      and(
        eq(tripInvitations.id, invitationId),
        eq(tripInvitations.tripId, tripId),
        eq(tripInvitations.status, "pending"),
      ),
    );
}

/** Pending invitations addressed to the given email (for the invitee's view). */
export async function listMyInvitations(userEmail: string) {
  const email = normalizeEmail(userEmail);
  return db
    .select({
      id: tripInvitations.id,
      tripId: tripInvitations.tripId,
      role: tripInvitations.role,
      tripName: trips.name,
    })
    .from(tripInvitations)
    .innerJoin(trips, eq(trips.id, tripInvitations.tripId))
    .where(
      and(
        eq(tripInvitations.email, email),
        eq(tripInvitations.status, "pending"),
      ),
    )
    .orderBy(tripInvitations.createdAt);
}

/** Accept or decline; returns the trip id. Only the addressed user may respond. */
export async function respondToInvitation(
  user: { id: string; email: string },
  invitationId: string,
  accept: boolean,
): Promise<string> {
  const [invite] = await db
    .select()
    .from(tripInvitations)
    .where(eq(tripInvitations.id, invitationId))
    .limit(1);
  if (!invite) throw new AccessError("Einladung nicht gefunden.");
  if (!canRespond(invite, user.email)) {
    throw new AccessError("Diese Einladung ist nicht an dich gerichtet.");
  }

  if (accept) {
    await db.batch([
      db
        .insert(tripMembers)
        .values({ tripId: invite.tripId, userId: user.id, role: invite.role })
        .onConflictDoNothing({
          target: [tripMembers.tripId, tripMembers.userId],
        }),
      db
        .update(tripInvitations)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(tripInvitations.id, invitationId)),
    ]);
  } else {
    await db
      .update(tripInvitations)
      .set({ status: "declined", respondedAt: new Date() })
      .where(eq(tripInvitations.id, invitationId));
  }

  return invite.tripId;
}
