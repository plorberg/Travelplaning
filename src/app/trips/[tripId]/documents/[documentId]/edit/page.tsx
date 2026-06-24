import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { getDocument } from "@/lib/documents";
import { hasAtLeastRole } from "@/lib/authz";
import { updateDocumentAction } from "@/app/trips/document-actions";
import { DocumentForm } from "@/app/trips/_components/DocumentForm";

export const dynamic = "force-dynamic";

const toInput = (d: Date | null) => (d ? d.toISOString().slice(0, 16) : "");

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ tripId: string; documentId: string }>;
}) {
  const { tripId, documentId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/documents`);

  const [doc, tripStops] = await Promise.all([
    getDocument(user.id, tripId, documentId),
    listStops(user.id, tripId),
  ]);
  if (!doc) notFound();

  const action = updateDocumentAction.bind(null, tripId, documentId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/documents`}>← Documents</Link>
      </p>
      <h1>Edit document</h1>
      <DocumentForm
        action={action}
        submitLabel="Save document"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        tripId={tripId}
        tripName={trip.name}
        defaults={{
          type: doc.type,
          title: doc.title,
          vendor: doc.vendor ?? "",
          bookingRef: doc.bookingRef ?? "",
          stopId: doc.stopId ?? "",
          startAt: toInput(doc.startAt),
          endAt: toInput(doc.endAt),
          location: doc.location ?? "",
          price: doc.price ?? "",
          currency: doc.currency ?? "",
          notes: doc.notes ?? "",
          externalUrl: doc.externalUrl ?? "",
          driveFileId: doc.driveFileId ?? "",
          driveFileUrl: doc.driveFileUrl ?? "",
        }}
      />
    </main>
  );
}
