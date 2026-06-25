import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { hasAtLeastRole } from "@/lib/authz";
import { createSpotAction } from "@/app/trips/spot-actions";
import { SpotForm } from "@/app/trips/_components/SpotForm";

export const dynamic = "force-dynamic";

export default async function NewSpotPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/spots`);

  const tripStops = await listStops(user.id, tripId);
  const action = createSpotAction.bind(null, tripId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/spots`}>← Gespeicherte Orte</Link>
      </p>
      <h1>Ort hinzufügen</h1>
      <SpotForm
        action={action}
        submitLabel="Ort hinzufügen"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
      />
    </main>
  );
}
