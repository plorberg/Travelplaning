import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips";
import { listStops } from "@/lib/stops";
import { getExpenseSummary, listExpenses } from "@/lib/expenses";
import { hasAtLeastRole } from "@/lib/authz";
import { expenseCategoryValues, type ExpenseCategory } from "@/lib/validation";
import { deleteExpenseAction } from "@/app/trips/expense-actions";
import { expenseCategoryLabels } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { tripId } = await params;
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const trip = await getTripForUser(user.id, tripId);
  if (!trip) notFound();
  const canEdit = hasAtLeastRole(trip.role, "editor");

  const tripStops = await listStops(user.id, tripId);
  const stopIds = new Set(tripStops.map((s) => s.id));

  const rawCategory = typeof sp.category === "string" ? sp.category : "";
  const category = (expenseCategoryValues as readonly string[]).includes(rawCategory)
    ? (rawCategory as ExpenseCategory)
    : undefined;
  const rawStop = typeof sp.stopId === "string" ? sp.stopId : "";
  const stopId = stopIds.has(rawStop) ? rawStop : undefined;

  const [summary, list] = await Promise.all([
    getExpenseSummary(user.id, tripId),
    listExpenses(user.id, tripId, { category, stopId }),
  ]);

  const budget = trip.budget ? Number(trip.budget) : null;
  const remaining = budget != null ? budget - summary.total : null;
  const fmt = (n: number) => formatMoney(n, trip.homeCurrency);
  const filtered = Boolean(category || stopId);

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <p>
        <Link href={`/trips/${tripId}`}>← {trip.name}</Link>
      </p>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Ausgaben</h1>
        {canEdit ? <Link href={`/trips/${tripId}/expenses/new`}>+ Ausgabe hinzufügen</Link> : null}
      </header>

      <section
        style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          margin: "1rem 0",
          padding: "0.75rem 1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <div>
          <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>Gesamtausgaben</div>
          <strong>{fmt(summary.total)}</strong>
        </div>
        <div>
          <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>Budget</div>
          <strong>{budget != null ? fmt(budget) : "—"}</strong>
        </div>
        <div>
          <div style={{ opacity: 0.7, fontSize: "0.8rem" }}>Verbleibend</div>
          <strong style={{ color: remaining != null && remaining < 0 ? "crimson" : undefined }}>
            {remaining != null ? fmt(remaining) : "—"}
          </strong>
        </div>
      </section>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ marginBottom: "0.25rem" }}>Nach Kategorie</h3>
          {summary.byCategory.length === 0 ? (
            <p style={{ opacity: 0.7 }}>—</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {summary.byCategory.map((c) => (
                <li key={c.category}>
                  {expenseCategoryLabels[c.category] ?? c.category}: {fmt(c.total)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 style={{ marginBottom: "0.25rem" }}>Nach Station</h3>
          {summary.byStop.length === 0 ? (
            <p style={{ opacity: 0.7 }}>—</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {summary.byStop.map((s) => (
                <li key={s.city}>
                  {s.city}: {fmt(s.total)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form method="get" style={{ display: "flex", gap: "0.5rem", margin: "1.5rem 0 1rem", flexWrap: "wrap" }}>
        <select name="category" defaultValue={category ?? ""}>
          <option value="">Alle Kategorien</option>
          {expenseCategoryValues.map((c) => (
            <option key={c} value={c}>
              {expenseCategoryLabels[c] ?? c}
            </option>
          ))}
        </select>
        <select name="stopId" defaultValue={stopId ?? ""}>
          <option value="">Alle Stationen</option>
          {tripStops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.city}
            </option>
          ))}
        </select>
        <button type="submit">Filtern</button>
        {filtered ? <Link href={`/trips/${tripId}/expenses`}>Zurücksetzen</Link> : null}
      </form>

      {list.length === 0 ? (
        <p className="empty">
          {filtered ? "Keine Ausgaben entsprechen dem Filter." : "Noch keine Ausgaben."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.6rem" }}>
          {list.map((e) => (
            <li
              key={e.id}
              style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}
            >
              <div>
                <strong>{formatMoney(e.amount, e.currency)}</strong>{" "}
                {e.currency !== trip.homeCurrency ? (
                  <span style={{ opacity: 0.7 }}>
                    ≈ {formatMoney(e.convertedAmount, trip.homeCurrency)}
                  </span>
                ) : null}
                <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                  {formatDate(e.date)} · {expenseCategoryLabels[e.category] ?? e.category}
                  {e.stopCity ? ` · ${e.stopCity}` : ""}
                  {e.paymentMethod ? ` · ${e.paymentMethod}` : ""}
                </div>
                {e.notes ? <div style={{ fontSize: "0.85rem" }}>{e.notes}</div> : null}
                {e.receiptUrl ? (
                  <a href={e.receiptUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem" }}>
                    Beleg ↗
                  </a>
                ) : null}
              </div>
              {canEdit ? (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                  <Link href={`/trips/${tripId}/expenses/${e.id}/edit`}>Bearbeiten</Link>
                  <form action={deleteExpenseAction.bind(null, tripId, e.id)}>
                    <button type="submit">Löschen</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
