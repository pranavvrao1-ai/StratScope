import Link from "next/link";
import { editorPageClient } from "@/lib/auth";
import { ArticleTable, type AdminArticleRow } from "@/components/admin/article-table";
import { PageTitle, buttonPrimary } from "@/components/admin/ui";
import type { Category } from "@/lib/content/types";

export default async function AdminDashboard() {
  const { supabase } = await editorPageClient();
  const [{ data: articles, error }, { data: categories }, comments, subscribers, messages] = await Promise.all([
    supabase
      .from("articles")
      .select("id, slug, title, category, status, featured, published_date, scheduled_date, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("subscribers").select("id", { count: "exact", head: true }).is("unsubscribed_at", null),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false),
  ]);

  const rows = (articles ?? []) as AdminArticleRow[];
  const stats = [
    { label: "Published", value: rows.filter((a) => a.status === "published").length },
    { label: "Drafts", value: rows.filter((a) => a.status === "draft").length },
    { label: "Scheduled", value: rows.filter((a) => a.status === "scheduled").length },
    { label: "Comments", value: comments.count ?? 0 },
    { label: "Subscribers", value: subscribers.count ?? 0 },
    { label: "Unread messages", value: messages.count ?? 0 },
  ];

  return (
    <>
      <PageTitle eyebrow="Dashboard" title="Article Command">
        <Link href="/admin/articles/new" className={buttonPrimary}>
          + New Article
        </Link>
      </PageTitle>
      <dl className="mb-10 grid grid-cols-2 gap-px border border-white/10 bg-white/10 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink p-5">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-gray-500">{s.label}</dt>
            <dd className="mt-2 font-serif text-3xl font-bold text-white">{s.value}</dd>
          </div>
        ))}
      </dl>
      {error && <p className="mb-6 text-sm text-red-400">Could not load articles: {error.message}</p>}
      <ArticleTable articles={rows} categories={(categories ?? []) as Category[]} />
    </>
  );
}
