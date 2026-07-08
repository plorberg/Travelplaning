"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  addPackingItem,
  deletePackingItem,
  togglePackingItem,
} from "@/lib/packing";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z
    .string()
    .trim()
    .max(100)
    .transform((s) => (s === "" ? undefined : s))
    .optional(),
});

async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user.id;
}

export async function addPackingItemAction(
  tripId: string,
  formData: FormData,
): Promise<void> {
  const userId = await requireUserId();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") ?? "",
  });
  if (!parsed.success) return; // empty/overlong input: nothing to add
  await addPackingItem(userId, tripId, parsed.data);
  revalidatePath(`/trips/${tripId}/packing`);
}

export async function togglePackingItemAction(
  tripId: string,
  itemId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await togglePackingItem(userId, tripId, itemId);
  revalidatePath(`/trips/${tripId}/packing`);
}

export async function deletePackingItemAction(
  tripId: string,
  itemId: string,
  _formData?: FormData,
): Promise<void> {
  const userId = await requireUserId();
  await deletePackingItem(userId, tripId, itemId);
  revalidatePath(`/trips/${tripId}/packing`);
}
