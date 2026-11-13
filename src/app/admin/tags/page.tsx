import { RowActions } from "@/components/admin/row-actions";
import { TagRename } from "@/components/admin/tag-rename";
import { Empty, PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";

export default async function TagsPage() {
  const { supabase } = await editorPageClient();
  const { data } = await supabase.from("articles").select("tags");
  const counts = new Map<string, number>();
  for (const row of data ?? []) for (const t of (row.tags as string[]) ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return (
    <>
      <PageTitle eyebrow="Taxonomy" title="Tags" />
      <p className="mb-6 max-w-2xl text-sm text-gray-400">
        Tags are added in the article editor. Renaming or removing a tag here updates every article that uses it.
      </p>
      {tags.length === 0 ? (
        <Empty>NO TAGS YET</Empty>
      ) : (
        <div className="divide-y divide-white/5 border border-white/10">
          {tags.map(([tag, n]) => (
            <div key={tag} className="flex flex-wrap items-center gap-4 p-3">
              <span className="flex-1 font-mono text-sm text-white">{tag}</span>
              <span className="font-mono text-xs text-gray-500">
                {n} article{n === 1 ? "" : "s"}
              </span>
              <TagRename tag={tag} />
              <RowActions actions={[{ label: "Remove", action: "removeTag", arg: tag, danger: true }]} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
