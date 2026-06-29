import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { listSavedSpots } from "@/lib/saved-spots";
import { toMapPoints } from "@/lib/map-points";
import { TripMap } from "@/app/trips/_components/TripMap";

export const dynamic = "force-dynamic";

export default async function TripMapPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();

  const [stops, spots] = await Promise.all([
    listStops(user.id, tripId),
    listSavedSpots(user.id, tripId),
  ]);
  const points = toMapPoints(stops, spots);

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← {trip.name}</Link>
      </p>
      <h1>Karte</h1>
      {points.length === 0 ? (
        <p className="empty">
          Noch keine Stationen oder Empfehlungen mit Koordinaten. Füge Koordinaten
          zu einer <Link href={`/trips/${tripId}/stops/new`}>Station</Link> oder
          einer <Link href={`/trips/${tripId}/spots/new`}>Empfehlung</Link> hinzu.
        </p>
      ) : (
        <TripMap points={points} />
      )}
    </main>
  );
}
