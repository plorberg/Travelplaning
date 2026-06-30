import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { hasAtLeastRole } from "@/lib/authz";
import { importSpotsAction } from "@/app/trips/spot-actions";
import { KmlImport } from "@/app/trips/_components/KmlImport";

export const dynamic = "force-dynamic";

export default async function ImportSpotsPage({
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

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/spots`} className="btn btn-ghost">← Empfehlungen</Link>
      </p>
      <h1>Empfehlungen aus Google My Maps (KML) importieren</h1>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        Punkte (Placemarks) werden als Empfehlungen übernommen; die My-Maps-Ebene
        bestimmt – soweit erkennbar – die Kategorie. Linien/Flächen werden
        ignoriert. Die Übernahme erfolgt einmalig (kein Live-Abgleich).
      </p>
      <KmlImport
        action={importSpotsAction.bind(null, tripId)}
        spotsHref={`/trips/${tripId}/spots`}
      />
    </main>
  );
}
