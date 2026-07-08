import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listPackingItems } from "@/lib/packing";
import { hasAtLeastRole } from "@/lib/authz";
import { PackingList } from "@/app/trips/_components/PackingList";

export const dynamic = "force-dynamic";

export default async function PackingPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  const canEdit = hasAtLeastRole(trip.role, "editor");

  const items = await listPackingItems(user.id, tripId);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`} className="btn btn-ghost">← {trip.name}</Link>
      </p>
      <h1>Packliste</h1>
      <PackingList tripId={tripId} items={items} canEdit={canEdit} />
    </main>
  );
}
