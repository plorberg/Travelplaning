import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
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

  const tripStops = await listStops(user.id, tripId);
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
        defaults={{ type: "activity" }}
      />
    </main>
  );
}
