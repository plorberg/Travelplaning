import { and, desc, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { expenses, stops, tripMembers } from "@/db/schema";
import { hasAtLeastRole } from "@/lib/authz";
import { AccessError, getMembership, getTripForUser } from "@/lib/trips";
import { resolveRate } from "@/lib/currency/rates";
import { convertAmount } from "@/lib/currency/provider";
import type { ExpenseCategory, ExpenseInput } from "@/lib/validation";

async function requireMember(userId: string, tripId: string) {
  const role = await getMembership(userId, tripId);
  if (!role) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  return role;
}

async function requireTripForEditor(userId: string, tripId: string) {
  const trip = await getTripForUser(userId, tripId);
  if (!trip) throw new AccessError("Du hast keinen Zugriff auf diese Reise.");
  if (!hasAtLeastRole(trip.role, "editor")) {
    throw new AccessError("Nur Bearbeiter oder der Eigentümer können Ausgaben ändern.");
  }
  return trip;
}

// Sanitize stop/member references so an expense can never point outside its trip.
async function tripScopeIds(tripId: string) {
  const [memberRows, stopRows] = await Promise.all([
    db.select({ id: tripMembers.userId }).from(tripMembers).where(eq(tripMembers.tripId, tripId)),
    db.select({ id: stops.id }).from(stops).where(eq(stops.tripId, tripId)),
  ]);
  return {
    memberIds: new Set(memberRows.map((r) => r.id)),
    stopIds: new Set(stopRows.map((r) => r.id)),
  };
}

async function buildRow(tripId: string, homeCurrency: string, input: ExpenseInput) {
  const { memberIds, stopIds } = await tripScopeIds(tripId);
  const rate = await resolveRate({
    from: input.currency,
    to: homeCurrency,
    manualRate: input.manualRate,
  });
  const converted = convertAmount(Number(input.amount), rate.rate);
  return {
    stopId: input.stopId && stopIds.has(input.stopId) ? input.stopId : null,
    date: input.date,
    category: input.category,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    convertedAmount: converted.toFixed(2),
    exchangeRateUsed: rate.rate.toString(),
    paymentMethod: input.paymentMethod ?? null,
    paidBy: input.paidBy && memberIds.has(input.paidBy) ? input.paidBy : null,
    splitWith: input.splitWith.filter((id) => memberIds.has(id)),
    notes: input.notes ?? null,
    receiptUrl: input.receiptUrl ?? null,
  };
}

export type ExpenseFilter = { category?: ExpenseCategory; stopId?: string };

export async function listExpenses(
  userId: string,
  tripId: string,
  filter: ExpenseFilter = {},
) {
  await requireMember(userId, tripId);
  const conds = [eq(expenses.tripId, tripId)];
  if (filter.category) conds.push(eq(expenses.category, filter.category));
  if (filter.stopId) conds.push(eq(expenses.stopId, filter.stopId));
  return db
    .select({
      id: expenses.id,
      date: expenses.date,
      category: expenses.category,
      amount: expenses.amount,
      currency: expenses.currency,
      convertedAmount: expenses.convertedAmount,
      stopId: expenses.stopId,
      stopCity: stops.city,
      paymentMethod: expenses.paymentMethod,
      notes: expenses.notes,
      receiptUrl: expenses.receiptUrl,
    })
    .from(expenses)
    .leftJoin(stops, eq(stops.id, expenses.stopId))
    .where(and(...conds))
    .orderBy(desc(expenses.date), desc(expenses.createdAt));
}

export async function getExpense(userId: string, tripId: string, expenseId: string) {
  await requireMember(userId, tripId);
  const [row] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId)))
    .limit(1);
  return row ?? null;
}

export async function createExpense(userId: string, tripId: string, input: ExpenseInput) {
  const trip = await requireTripForEditor(userId, tripId);
  const row = await buildRow(tripId, trip.homeCurrency, input);
  await db.insert(expenses).values({ tripId, ...row, createdBy: userId });
}

// An explicit edit re-resolves the rate for this expense; we never silently
// recalculate other (historic) expenses when rates change.
export async function updateExpense(
  userId: string,
  tripId: string,
  expenseId: string,
  input: ExpenseInput,
) {
  const trip = await requireTripForEditor(userId, tripId);
  const row = await buildRow(tripId, trip.homeCurrency, input);
  await db
    .update(expenses)
    .set(row)
    .where(and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId)));
}

export async function deleteExpense(userId: string, tripId: string, expenseId: string) {
  await requireTripForEditor(userId, tripId);
  await db
    .delete(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.tripId, tripId)));
}

/** Spent total (trip home currency) per trip the user is a member of. */
export async function getTripSpendTotals(userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ tripId: expenses.tripId, total: sum(expenses.convertedAmount) })
    .from(expenses)
    .innerJoin(tripMembers, eq(tripMembers.tripId, expenses.tripId))
    .where(eq(tripMembers.userId, userId))
    .groupBy(expenses.tripId);
  return new Map(rows.map((r) => [r.tripId, Number(r.total ?? 0)]));
}

/** Totals in the trip home currency: overall, by category, and by stop. */
export async function getExpenseSummary(userId: string, tripId: string) {
  await requireMember(userId, tripId);
  const [[totalRow], byCategory, byStop] = await Promise.all([
    db
      .select({ total: sum(expenses.convertedAmount) })
      .from(expenses)
      .where(eq(expenses.tripId, tripId)),
    db
      .select({ category: expenses.category, total: sum(expenses.convertedAmount) })
      .from(expenses)
      .where(eq(expenses.tripId, tripId))
      .groupBy(expenses.category),
    db
      .select({ stopId: expenses.stopId, city: stops.city, total: sum(expenses.convertedAmount) })
      .from(expenses)
      .leftJoin(stops, eq(stops.id, expenses.stopId))
      .where(eq(expenses.tripId, tripId))
      .groupBy(expenses.stopId, stops.city),
  ]);

  return {
    total: Number(totalRow?.total ?? 0),
    byCategory: byCategory.map((r) => ({ category: r.category, total: Number(r.total ?? 0) })),
    byStop: byStop.map((r) => ({
      city: r.city ?? "Unassigned",
      total: Number(r.total ?? 0),
    })),
  };
}
