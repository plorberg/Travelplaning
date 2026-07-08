import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { FlightSearch } from "@/app/trips/_components/FlightSearch";

export const dynamic = "force-dynamic";

export default async function FlightsPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← {trip.name}</Link>
      </p>
      <h1>Flights</h1>
      <p style={{ opacity: 0.8 }}>
        Build a Google Flights search from your trip details, then save any
        booking under Documents.
      </p>
      <FlightSearch destinationDefault={trip.mainDestination ?? ""} />
    </main>
  );
}
