"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { inviteInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import {
  inviteToTrip,
  respondToInvitation,
  revokeInvitation,
} from "@/lib/invitations";
import type { FormState } from "@/app/trips/actions";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

function messageFrom(e: unknown): string {
  if (e instanceof AccessError) return e.message;
  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}

export async function inviteAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = inviteInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await inviteToTrip(user.id, tripId, parsed.data.email, parsed.data.role);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}`);
  return { success: "Einladung erstellt." };
}

export async function revokeInvitationAction(
  tripId: string,
  invitationId: string,
  _formData?: FormData,
): Promise<void> {
  const user = await requireUser();
  await revokeInvitation(user.id, tripId, invitationId);
  revalidatePath(`/trips/${tripId}`);
}

export async function acceptInvitationAction(
  invitationId: string,
  _formData?: FormData,
): Promise<void> {
  const user = await requireUser();
  const tripId = await respondToInvitation(user, invitationId, true);
  revalidatePath("/dashboard");
  redirect(`/trips/${tripId}`);
}

export async function declineInvitationAction(
  invitationId: string,
  _formData?: FormData,
): Promise<void> {
  const user = await requireUser();
  await respondToInvitation(user, invitationId, false);
  revalidatePath("/dashboard");
}
