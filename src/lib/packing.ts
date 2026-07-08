import { and, asc, eq, not } from "drizzle-orm";
import { db } from "@/db";
import { packingItems } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership } from "@/lib/trips";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return role;
}

async function requireEditor(userId: string, tripId: string): Promise<void> {
  const role = await requireMember(userId, tripId);
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können die Packliste ändern.");
  }
}

export async function listPackingItems(userId: string, tripId: string) {
  await requireMember(userId, tripId);
  return db
    .select({
      id: packingItems.id,
      name: packingItems.name,
      category: packingItems.category,
      done: packingItems.done,
    })
    .from(packingItems)
    .where(eq(packingItems.tripId, tripId))
    .orderBy(asc(packingItems.createdAt));
}

export async function addPackingItem(
  userId: string,
  tripId: string,
  input: { name: string; category?: string },
) {
  await requireEditor(userId, tripId);
  await db.insert(packingItems).values({
    tripId,
    name: input.name,
    category: input.category ?? null,
    createdBy: userId,
  });
}

export async function togglePackingItem(userId: string, tripId: string, itemId: string) {
  await requireEditor(userId, tripId);
  await db
    .update(packingItems)
    .set({ done: not(packingItems.done) })
    .where(and(eq(packingItems.id, itemId), eq(packingItems.tripId, tripId)));
}

export async function deletePackingItem(userId: string, tripId: string, itemId: string) {
  await requireEditor(userId, tripId);
  await db
    .delete(packingItems)
    .where(and(eq(packingItems.id, itemId), eq(packingItems.tripId, tripId)));
}
