"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { expenseInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import { createExpense, deleteExpense, updateExpense } from "@/lib/expenses";
import type { FormState } from "@/app/trips/actions";

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user.id;
}

function messageFrom(e: unknown): string {
  if (e instanceof AccessError) return e.message;
  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}

function parse(formData: FormData) {
  // splitWith arrives as repeated checkbox values; collect them explicitly.
  const obj = {
    ...Object.fromEntries(formData),
    splitWith: formData.getAll("splitWith"),
  };
  return expenseInputSchema.safeParse(obj);
}

export async function createExpenseAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await createExpense(userId, tripId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/expenses`);
  redirect(`/trips/${tripId}/expenses`);
}

export async function updateExpenseAction(
  tripId: string,
  expenseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await updateExpense(userId, tripId, expenseId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/expenses`);
  redirect(`/trips/${tripId}/expenses`);
}

export async function deleteExpenseAction(
  tripId: string,
  expenseId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deleteExpense(userId, tripId, expenseId);
  revalidatePath(`/trips/${tripId}/expenses`);
}
