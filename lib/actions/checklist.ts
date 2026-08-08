"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { addItemToActiveList, removeItem, setItemChecked } from "@/lib/db/shoppingLists";

export async function addToActiveList(storeId: string, productId: string) {
  const supabase = createServiceClient();
  await addItemToActiveList(supabase, storeId, productId);
  revalidatePath("/checklist");
}

export async function toggleChecklistItem(itemId: string, checked: boolean) {
  const supabase = createServiceClient();
  await setItemChecked(supabase, itemId, checked);
  revalidatePath("/checklist");
}

export async function removeChecklistItem(itemId: string) {
  const supabase = createServiceClient();
  await removeItem(supabase, itemId);
  revalidatePath("/checklist");
}
