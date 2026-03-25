import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryItemCardSelect, serializeLibraryCard, type UserLibraryItemRow } from "@/lib/serializers";

export async function getLibraryItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_library_items")
    .select(libraryItemCardSelect)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserLibraryItemRow[] | null)?.map(serializeLibraryCard) ?? [];
}
