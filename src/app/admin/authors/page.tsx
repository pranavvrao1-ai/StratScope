import { AuthorManager } from "@/components/admin/author-manager";
import { PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";
import type { Author } from "@/lib/content/types";

export default async function AuthorsPage() {
  const { supabase } = await editorPageClient();
  const [{ data: authors }, { data: articles }] = await Promise.all([
    supabase.from("authors").select("*").order("name"),
    supabase.from("articles").select("author_id"),
  ]);
  const counts: Record<string, number> = {};
  for (const a of articles ?? []) if (a.author_id) counts[a.author_id] = (counts[a.author_id] ?? 0) + 1;
  return (
    <>
      <PageTitle eyebrow="Contributors" title="Authors" />
      <AuthorManager authors={(authors ?? []) as Author[]} counts={counts} />
    </>
  );
}
