import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { listSavedSpots } from "@/lib/saved-spots";
import { listDocuments } from "@/lib/documents";
import { hasAtLeastRole } from "@/lib/authz";
import { createItineraryAction } from "@/app/trips/itinerary-actions";
import { ItineraryForm } from "@/app/trips/_components/ItineraryForm";

export const dynamic = "force-dynamic";

export default async function NewItineraryItemPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/itinerary`);

  const [tripStops, spots, docs] = await Promise.all([
    listStops(user.id, tripId),
    listSavedSpots(user.id, tripId),
    listDocuments(user.id, tripId),
  ]);
  const action = createItineraryAction.bind(null, tripId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/itinerary`}>← Reiseplan</Link>
      </p>
      <h1>Eintrag hinzufügen</h1>
      <ItineraryForm
        action={action}
        submitLabel="Eintrag hinzufügen"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        savedSpots={spots.map((s) => ({ id: s.id, name: s.name, address: s.address, lat: s.lat, lng: s.lng }))}
        documents={docs.map((d) => ({ id: d.id, title: d.title }))}
        defaults={{ type: "activity" }}
      />
    </main>
  );
}
