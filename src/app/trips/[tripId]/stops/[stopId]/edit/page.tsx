import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { getStop } from "@/lib/stops";
import { hasAtLeastRole } from "@/lib/authz";
import { updateStopAction } from "@/app/trips/stop-actions";
import { StopForm } from "@/app/trips/_components/StopForm";

export const dynamic = "force-dynamic";

export default async function EditStopPage({
  params,
}: {
  params: Promise<{ tripId: string; stopId: string }>;
}) {
  const { tripId, stopId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}`);

  const stop = await getStop(user.id, tripId, stopId);
  if (!stop) notFound();

  const action = updateStopAction.bind(null, tripId, stopId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← Back to trip</Link>
      </p>
      <h1>Edit stop</h1>
      <StopForm
        action={action}
        submitLabel="Save stop"
        defaults={{
          city: stop.city,
          country: stop.country ?? "",
          arrivalDate: stop.arrivalDate ?? "",
          departureDate: stop.departureDate ?? "",
          accommodationName: stop.accommodationName ?? "",
          accommodationAddress: stop.accommodationAddress ?? "",
          lat: stop.lat != null ? String(stop.lat) : "",
          lng: stop.lng != null ? String(stop.lng) : "",
          notes: stop.notes ?? "",
        }}
      />
    </main>
  );
}
