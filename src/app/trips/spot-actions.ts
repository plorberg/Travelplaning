"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { spotInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import {
  createSavedSpot,
  deleteSavedSpot,
  updateSavedSpot,
} from "@/lib/saved-spots";
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

export async function createSpotAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = spotInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await createSavedSpot(userId, tripId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/spots`);
  redirect(`/trips/${tripId}/spots`);
}

export async function updateSpotAction(
  tripId: string,
  spotId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = spotInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await updateSavedSpot(userId, tripId, spotId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/spots`);
  redirect(`/trips/${tripId}/spots`);
}

export async function deleteSpotAction(
  tripId: string,
  spotId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deleteSavedSpot(userId, tripId, spotId);
  revalidatePath(`/trips/${tripId}/spots`);
}
