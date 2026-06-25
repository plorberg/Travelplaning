import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, stops } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership } from "@/lib/trips";
import type { DocumentInput } from "@/lib/validation";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return role;
}

async function requireEditor(userId: string, tripId: string): Promise<void> {
  const role = await requireMember(userId, tripId);
  if (!hasAtLeastRole(role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können Dokumente ändern.");
  }
}

function toDate(value?: string): Date | null {
  return value ? new Date(`${value}:00Z`) : null;
}

async function tripStopIds(tripId: string): Promise<Set<string>> {
  const rows = await db.select({ id: stops.id }).from(stops).where(eq(stops.tripId, tripId));
  return new Set(rows.map((r) => r.id));
}

function toRow(stopIds: Set<string>, input: DocumentInput) {
  return {
    type: input.type,
    title: input.title,
    vendor: input.vendor ?? null,
    bookingRef: input.bookingRef ?? null,
    stopId: input.stopId && stopIds.has(input.stopId) ? input.stopId : null,
    startAt: toDate(input.startAt),
    endAt: toDate(input.endAt),
    location: input.location ?? null,
    price: input.price ?? null,
    currency: input.currency ?? null,
    notes: input.notes ?? null,
    externalUrl: input.externalUrl ?? null,
    driveFileId: input.driveFileId ?? null,
    driveFileUrl: input.driveFileUrl ?? null,
  };
}

export async function listDocuments(userId: string, tripId: string) {
  await requireMember(userId, tripId);
  return db
    .select({
      id: documents.id,
      type: documents.type,
      title: documents.title,
      vendor: documents.vendor,
      bookingRef: documents.bookingRef,
      startAt: documents.startAt,
      endAt: documents.endAt,
      location: documents.location,
      price: documents.price,
      currency: documents.currency,
      notes: documents.notes,
      externalUrl: documents.externalUrl,
      driveFileUrl: documents.driveFileUrl,
      stopId: documents.stopId,
      stopCity: stops.city,
    })
    .from(documents)
    .leftJoin(stops, eq(stops.id, documents.stopId))
    .where(eq(documents.tripId, tripId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocument(userId: string, tripId: string, documentId: string) {
  await requireMember(userId, tripId);
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.tripId, tripId)))
    .limit(1);
  return row ?? null;
}

export async function createDocument(userId: string, tripId: string, input: DocumentInput) {
  await requireEditor(userId, tripId);
  const stopIds = await tripStopIds(tripId);
  await db.insert(documents).values({ tripId, ...toRow(stopIds, input), createdBy: userId });
}

export async function updateDocument(
  userId: string,
  tripId: string,
  documentId: string,
  input: DocumentInput,
) {
  await requireEditor(userId, tripId);
  const stopIds = await tripStopIds(tripId);
  await db
    .update(documents)
    .set(toRow(stopIds, input))
    .where(and(eq(documents.id, documentId), eq(documents.tripId, tripId)));
}

export async function deleteDocument(userId: string, tripId: string, documentId: string) {
  await requireEditor(userId, tripId);
  await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.tripId, tripId)));
}
