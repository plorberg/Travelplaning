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
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← {trip.name}</Link>
      </p>
      <h1>Flüge suchen</h1>
      <p style={{ opacity: 0.8 }}>
        Wir öffnen eine vorausgefüllte Google-Flights-Suche – die Buchung
        erfolgt dort.
      </p>
      <FlightSearch
        documentsHref={`/trips/${tripId}/documents/new`}
        defaults={{
          departDate: trip.startDate ?? "",
          returnDate: trip.endDate ?? "",
          currency: trip.homeCurrency,
        }}
      />
    </main>
  );
}
