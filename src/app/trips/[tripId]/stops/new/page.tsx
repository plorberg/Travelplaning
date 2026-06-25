import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { hasAtLeastRole } from "@/lib/authz";
import { createStopAction } from "@/app/trips/stop-actions";
import { StopForm } from "@/app/trips/_components/StopForm";

export const dynamic = "force-dynamic";

export default async function NewStopPage({
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

  const action = createStopAction.bind(null, tripId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← Zurück zur Reise</Link>
      </p>
      <h1>Station hinzufügen</h1>
      <StopForm action={action} submitLabel="Station hinzufügen" />
    </main>
  );
}
