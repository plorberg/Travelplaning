"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { documentInputSchema } from "@/lib/validation";
import { AccessError } from "@/lib/trips";
import { createDocument, deleteDocument, updateDocument } from "@/lib/documents";
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

export async function createDocumentAction(
  tripId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = documentInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await createDocument(userId, tripId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/documents`);
  redirect(`/trips/${tripId}/documents`);
}

export async function updateDocumentAction(
  tripId: string,
  documentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = documentInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await updateDocument(userId, tripId, documentId, parsed.data);
  } catch (e) {
    return { error: messageFrom(e) };
  }
  revalidatePath(`/trips/${tripId}/documents`);
  redirect(`/trips/${tripId}/documents`);
}

export async function deleteDocumentAction(
  tripId: string,
  documentId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deleteDocument(userId, tripId, documentId);
  revalidatePath(`/trips/${tripId}/documents`);
}
