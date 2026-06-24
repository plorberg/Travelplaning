"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { itineraryInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import {
  createItineraryItem,
  deleteItineraryItem,
  updateItineraryItem,
} from "@/lib/itinerary";
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

export async function createItineraryAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = itineraryInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await createItineraryItem(userId, tripId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/itinerary`);
  redirect(`/trips/${tripId}/itinerary`);
}

export async function updateItineraryAction(
  tripId: string,
  itemId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = itineraryInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await updateItineraryItem(userId, tripId, itemId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/itinerary`);
  redirect(`/trips/${tripId}/itinerary`);
}

export async function deleteItineraryAction(
  tripId: string,
  itemId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deleteItineraryItem(userId, tripId, itemId);
  revalidatePath(`/trips/${tripId}/itinerary`);
}
