import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { getItineraryItem } from "@/lib/itinerary";
import { hasAtLeastRole } from "@/lib/authz";
import { updateItineraryAction } from "@/app/trips/itinerary-actions";
import { ItineraryForm } from "@/app/trips/_components/ItineraryForm";

export const dynamic = "force-dynamic";

const toInput = (d: Date | null) => (d ? d.toISOString().slice(0, 16) : "");

export default async function EditItineraryItemPage({
  params,
}: {
  params: Promise<{ tripId: string; itemId: string }>;
}) {
  const { tripId, itemId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/itinerary`);

  const [item, tripStops] = await Promise.all([
    getItineraryItem(user.id, tripId, itemId),
    listStops(user.id, tripId),
  ]);
  if (!item) notFound();

  const action = updateItineraryAction.bind(null, tripId, itemId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/itinerary`}>← Itinerary</Link>
      </p>
      <h1>Edit itinerary item</h1>
      <ItineraryForm
        action={action}
        submitLabel="Save item"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        defaults={{
          title: item.title,
          type: item.type,
          stopId: item.stopId ?? "",
          startAt: toInput(item.startAt),
          endAt: toInput(item.endAt),
          location: item.location ?? "",
          lat: item.lat != null ? String(item.lat) : "",
          lng: item.lng != null ? String(item.lng) : "",
          cost: item.cost ?? "",
          currency: item.currency ?? "",
          notes: item.notes ?? "",
        }}
      />
    </main>
  );
}
