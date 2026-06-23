"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { stopInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import { createStop, deleteStop, moveStop, updateStop } from "@/lib/stops";
import type { FormState } from "@/app/trips/actions";

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user.id;
}

function messageFrom(e: unknown): string {
  if (e instanceof AccessError) return e.message;
  return "Something went wrong. Please try again.";
}

export async function createStopAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = stopInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await createStop(userId, tripId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function updateStopAction(
  tripId: string,
  stopId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = stopInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await updateStop(userId, tripId, stopId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteStopAction(
  tripId: string,
  stopId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deleteStop(userId, tripId, stopId);
  revalidatePath(`/trips/${tripId}`);
}

export async function moveStopAction(
  tripId: string,
  stopId: string,
  direction: "up" | "down",
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await moveStop(userId, tripId, stopId, direction);
  revalidatePath(`/trips/${tripId}`);
}
