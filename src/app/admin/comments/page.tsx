import Link from "next/link";
import { RowActions } from "@/components/admin/row-actions";
import { Empty, PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

interface Row {
  id: string;
  author_name: string;
  content: string;
  likes: number;
  is_hidden: boolean;
  created_at: string;
  articles: { title: string; slug: string } | null;
}

export default async function CommentsPage() {
  const { supabase } = await editorPageClient();
  const { data } = await supabase
    .from("comments")
    .select("id, author_name, content, likes, is_hidden, created_at, articles(title, slug)")
    .order("created_at", { ascending: false })
    .limit(500);
  const comments = (data ?? []) as unknown as Row[];
  return (
    <>
      <PageTitle eyebrow="Moderation" title="Comments" />
      {comments.length === 0 ? (
        <Empty>NO COMMENTS</Empty>
      ) : (
        <div className="divide-y divide-white/5 border border-white/10">
          {comments.map((c) => (
            <div key={c.id} className={`space-y-2 p-4 ${c.is_hidden ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-gray-500">
                <span className="font-sans text-sm font-bold text-white">{c.author_name}</span>
                <span>{formatDateTime(c.created_at)}</span>
                <span>{c.likes} likes</span>
                {c.articles && (
                  <Link href={`/articles/${c.articles.slug}`} target="_blank" className="text-gold hover:text-white">
                    on &ldquo;{c.articles.title}&rdquo;
                  </Link>
                )}
                {c.is_hidden && <span className="uppercase text-yellow-500">hidden</span>}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-300">{c.content}</p>
              <RowActions
                actions={[
                  c.is_hidden ? { label: "Show", action: "showComment", arg: c.id } : { label: "Hide", action: "hideComment", arg: c.id },
                  { label: "Delete", action: "deleteComment", arg: c.id, danger: true },
                ]}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
