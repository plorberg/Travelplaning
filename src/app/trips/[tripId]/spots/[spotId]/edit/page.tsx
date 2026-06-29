import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { getSavedSpot } from "@/lib/saved-spots";
import { hasAtLeastRole } from "@/lib/authz";
import { updateSpotAction } from "@/app/trips/spot-actions";
import { SpotForm } from "@/app/trips/_components/SpotForm";

export const dynamic = "force-dynamic";

export default async function EditSpotPage({
  params,
}: {
  params: Promise<{ tripId: string; spotId: string }>;
}) {
  const { tripId, spotId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/spots`);

  const [spot, tripStops] = await Promise.all([
    getSavedSpot(user.id, tripId, spotId),
    listStops(user.id, tripId),
  ]);
  if (!spot) notFound();

  const action = updateSpotAction.bind(null, tripId, spotId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/spots`} className="btn btn-ghost">← Empfehlungen</Link>
      </p>
      <h1>Empfehlung bearbeiten</h1>
      <SpotForm
        action={action}
        submitLabel="Empfehlung speichern"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        defaults={{
          name: spot.name,
          category: spot.category ?? "",
          stopId: spot.stopId ?? "",
          address: spot.address ?? "",
          lat: spot.lat != null ? String(spot.lat) : "",
          lng: spot.lng != null ? String(spot.lng) : "",
          rating: spot.rating ?? "",
          source: spot.source ?? "",
          recommendedDurationMinutes:
            spot.recommendedDurationMinutes != null
              ? String(spot.recommendedDurationMinutes)
              : "",
          notes: spot.notes ?? "",
        }}
      />
    </main>
  );
}
