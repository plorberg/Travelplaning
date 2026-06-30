"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { spotInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import {
  createSavedSpot,
  deleteSavedSpot,
  updateSavedSpot,
  importSavedSpots,
} from "@/lib/saved-spots";
import type { FormState } from "@/app/trips/actions";

const spotImportSchema = z.array(spotInputSchema).min(1).max(2000);

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

export async function importSpotsAction(
  tripId: string,
  spots: unknown,
): Promise<{ imported?: number; error?: string }> {
  const userId = await requireUserId();
  const parsed = spotImportSchema.safeParse(spots);
  if (!parsed.success) {
    return { error: "Die KML-Datei enthält keine gültigen Orte." };
  }
  try {
    const imported = await importSavedSpots(userId, tripId, parsed.data);
    revalidatePath(`/trips/${tripId}/spots`);
    return { imported };
  } catch (e) {
    return { error: messageFrom(e) };
  }
}
