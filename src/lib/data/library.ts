import { createSupabaseServerClient } from "@/lib/supabase/server";
import { libraryItemCardSelect, serializeLibraryCard, type LibraryItemRow } from "@/lib/serializers";

export async function getLibraryItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("library_items")
    .select(libraryItemCardSelect)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as LibraryItemRow[] | null)?.map(serializeLibraryCard) ?? [];
}
