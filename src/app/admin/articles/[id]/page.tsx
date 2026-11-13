import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/article-editor";
import { editorPageClient } from "@/lib/auth";
import type { Article, Author, Category } from "@/lib/content/types";

export default async function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await editorPageClient();
  const [{ data: article }, { data: categories }, { data: authors }] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("authors").select("*").order("name"),
  ]);
  if (!article) notFound();
  return (
    <ArticleEditor
      key={article.id}
      article={article as Article}
      categories={(categories ?? []) as Category[]}
      authors={(authors ?? []) as Author[]}
    />
  );
}
