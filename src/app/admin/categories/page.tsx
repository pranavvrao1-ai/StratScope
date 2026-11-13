import { CategoryManager } from "@/components/admin/category-manager";
import { PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";
import type { Category } from "@/lib/content/types";

export default async function CategoriesPage() {
  const { supabase } = await editorPageClient();
  const [{ data: categories }, { data: articles }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("articles").select("category"),
  ]);
  const counts: Record<string, number> = {};
  for (const a of articles ?? []) counts[a.category] = (counts[a.category] ?? 0) + 1;
  return (
    <>
      <PageTitle eyebrow="Taxonomy" title="Categories" />
      <CategoryManager categories={(categories ?? []) as Category[]} counts={counts} />
    </>
  );
}
