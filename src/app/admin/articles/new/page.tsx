import { ArticleEditor } from "@/components/admin/article-editor";
import { editorPageClient } from "@/lib/auth";
import type { Author, Category } from "@/lib/content/types";

export default async function NewArticlePage() {
  const { supabase } = await editorPageClient();
  const [{ data: categories }, { data: authors }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("authors").select("*").order("name"),
  ]);
  return <ArticleEditor article={null} categories={(categories ?? []) as Category[]} authors={(authors ?? []) as Author[]} />;
}
