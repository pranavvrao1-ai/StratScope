import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/site/article-view";
import { StatusBadge } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";
import type { Article, Author, Category } from "@/lib/content/types";
import { siteUrl } from "@/lib/site";

/** Renders any article (including drafts) exactly as the public page would, for editors only. */
export default async function PreviewArticlePage({ params }: PageProps<"/admin/articles/[id]/preview">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await editorPageClient();
  const { data: article } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!article) notFound();
  const a = article as Article;
  const [{ data: category }, { data: author }] = await Promise.all([
    supabase.from("categories").select("*").eq("slug", a.category).maybeSingle(),
    a.author_id ? supabase.from("authors").select("*").eq("id", a.author_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return (
    <div className="-mx-6 -my-10 md:-mx-12">
      <div className="flex flex-wrap items-center gap-4 border-b border-gold/30 bg-gold/10 px-6 py-3 font-mono text-xs text-gold md:px-12">
        <span className="uppercase tracking-widest">Preview</span>
        <StatusBadge status={a.status} />
        <span className="text-gray-400">Showing the last saved version.</span>
        <Link href={`/admin/articles/${a.id}`} className="ml-auto uppercase tracking-widest hover:text-white">
          ← Back to editor
        </Link>
      </div>
      <ArticleView article={a} category={(category as Category) ?? null} author={(author as Author) ?? null} url={`${siteUrl()}/articles/${a.slug}`} />
    </div>
  );
}
