import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { hasAtLeastRole } from "@/lib/authz";
import { updateTripAction } from "@/app/trips/actions";
import { TripForm } from "@/app/trips/_components/TripForm";

export const dynamic = "force-dynamic";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}`);

  const action = updateTripAction.bind(null, tripId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← Zurück zur Reise</Link>
      </p>
      <h1>Reise bearbeiten</h1>
      <TripForm
        action={action}
        submitLabel="Änderungen speichern"
        defaults={{
          name: trip.name,
          mainDestination: trip.mainDestination ?? "",
          startDate: trip.startDate ?? "",
          endDate: trip.endDate ?? "",
          homeCurrency: trip.homeCurrency,
          budget: trip.budget ?? "",
          status: trip.status,
          travelStyle: trip.travelStyle ?? "",
          notes: trip.notes ?? "",
        }}
      />
    </main>
  );
}
