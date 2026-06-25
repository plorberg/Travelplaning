import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser, listMembers } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { hasAtLeastRole } from "@/lib/authz";
import { createExpenseAction } from "@/app/trips/expense-actions";
import { ExpenseForm } from "@/app/trips/_components/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/expenses`);

  const [tripStops, members] = await Promise.all([
    listStops(user.id, tripId),
    listMembers(user.id, tripId),
  ]);

  const action = createExpenseAction.bind(null, tripId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/expenses`}>← Ausgaben</Link>
      </p>
      <h1>Ausgabe hinzufügen</h1>
      <ExpenseForm
        action={action}
        submitLabel="Ausgabe hinzufügen"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        members={members.map((m) => ({ id: m.userId, label: m.name ?? m.email }))}
        homeCurrency={trip.homeCurrency}
        defaults={{ date: today, currency: trip.homeCurrency }}
      />
    </main>
  );
}
