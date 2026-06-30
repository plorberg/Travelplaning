import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser, listMembers } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { getExpense } from "@/lib/expenses";
import { hasAtLeastRole } from "@/lib/authz";
import { localCurrencyForDestination } from "@/lib/currency/local-currency";
import { updateExpenseAction } from "@/app/trips/expense-actions";
import { ExpenseForm } from "@/app/trips/_components/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ tripId: string; expenseId: string }>;
}) {
  const { tripId, expenseId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  if (!hasAtLeastRole(trip.role, "editor")) redirect(`/trips/${tripId}/expenses`);

  const [expense, tripStops, members] = await Promise.all([
    getExpense(user.id, tripId, expenseId),
    listStops(user.id, tripId),
    listMembers(user.id, tripId),
  ]);
  if (!expense) notFound();

  const action = updateExpenseAction.bind(null, tripId, expenseId);
  const localCurrency = localCurrencyForDestination(
    trip.mainDestination,
    tripStops.map((s) => s.country),
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}/expenses`} className="btn btn-ghost">← Ausgaben</Link>
      </p>
      <h1>Ausgabe bearbeiten</h1>
      <ExpenseForm
        action={action}
        submitLabel="Ausgabe speichern"
        stops={tripStops.map((s) => ({ id: s.id, city: s.city }))}
        members={members.map((m) => ({ id: m.userId, label: m.name ?? m.email }))}
        homeCurrency={trip.homeCurrency}
        localCurrency={localCurrency}
        defaults={{
          stopId: expense.stopId ?? "",
          date: expense.date,
          category: expense.category,
          amount: expense.amount,
          currency: expense.currency,
          // Pre-fill the stored rate so saving preserves it (clear to re-fetch).
          manualRate: expense.exchangeRateUsed ?? "",
          paymentMethod: expense.paymentMethod ?? "",
          paidBy: expense.paidBy ?? "",
          splitWith: expense.splitWith ?? [],
          notes: expense.notes ?? "",
          receiptUrl: expense.receiptUrl ?? "",
        }}
      />
    </main>
  );
}
