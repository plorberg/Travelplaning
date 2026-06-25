import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { hasAtLeastRole } from "@/lib/authz";
import { createDocumentAction } from "@/app/trips/document-actions";
import { DocumentForm } from "@/app/trips/_components/DocumentForm";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/documents`);

  const tripStops = await listStops(user.id, tripId);
  const action = createDocumentAction.bind(null, tripId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/documents`}>← Dokumente</Link>
      </p>
      <h1>Dokument hinzufügen</h1>
      <DocumentForm
        action={action}
        submitLabel="Dokument speichern"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        tripId={tripId}
        tripName={trip.name}
      />
    </main>
  );
}
