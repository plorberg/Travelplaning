"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { tripInputSchema } from "@/lib/validation";
import {
  AccessError,
  changeMemberRole,
  createTrip,
  deleteTrip,
  removeMember,
  updateTrip,
} from "@/lib/trips";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/");
  return session.user.id;
}

function messageFrom(e: unknown): string {
  if (e instanceof AccessError) return e.message;
  return "Something went wrong. Please try again.";
}

export async function createTripAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = tripInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const tripId = await createTrip(userId, parsed.data);
  revalidatePath("/dashboard");
  redirect(`/trips/${tripId}`);
}

export async function updateTripAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = tripInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await updateTrip(userId, tripId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}`);
  redirect(`/trips/${tripId}`);
}

export async function deleteTripAction(
  tripId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deleteTrip(userId, tripId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const roleSchema = z.enum(["owner", "editor", "viewer"]);

export async function changeMemberRoleAction(
  tripId: string,
  targetUserId: string,
  formData: FormData,
): Promise<void> {
  const userId = await requireUserId();
  const newRole = roleSchema.parse(formData.get("role"));
  await changeMemberRole(userId, tripId, targetUserId, newRole);
  revalidatePath(`/trips/${tripId}`);
}

export async function removeMemberAction(
  tripId: string,
  targetUserId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await removeMember(userId, tripId, targetUserId);
  revalidatePath(`/trips/${tripId}`);
}
