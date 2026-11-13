"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAuthor, saveAuthor } from "@/app/actions/admin";
import type { Author } from "@/lib/content/types";
import { slugify } from "@/lib/slug";
import { buttonDanger, buttonGhost, buttonPrimary, inputClass, labelClass } from "./ui";

interface Draft {
  slug: string;
  name: string;
  title: string;
  initials: string;
  bio: string;
}

export function AuthorManager({ authors, counts }: { authors: Author[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError("");
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed");
      else after?.();
      setConfirm(null);
      router.refresh();
    });

  const update = (key: keyof Draft, value: string) => {
    if (!editing) return;
    const draft = { ...editing.draft, [key]: value };
    if (key === "name" && editing.id === null) draft.slug = slugify(value);
    setEditing({ ...editing, draft });
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {editing ? (
        <form
          className="space-y-4 border border-gold/30 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveAuthor(editing.id, editing.draft), () => setEditing(null));
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(
              [
                ["name", "Name"],
                ["slug", "Slug"],
                ["title", "Title / byline (e.g. Founder & Editor-in-Chief, StratScope)"],
                ["initials", "Initials badge"],
              ] as const
            ).map(([k, l]) => (
              <div key={k}>
                <label htmlFor={`author-${k}`} className={labelClass}>
                  {l}
                </label>
                <input id={`author-${k}`} value={editing.draft[k]} onChange={(e) => update(k, e.target.value)} className={inputClass} />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="author-bio" className={labelClass}>
              Bio
            </label>
            <textarea id="author-bio" rows={3} value={editing.draft.bio} onChange={(e) => update("bio", e.target.value)} className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonPrimary}>
              Save author
            </button>
            <button type="button" className={buttonGhost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={buttonPrimary} onClick={() => setEditing({ id: null, draft: { slug: "", name: "", title: "", initials: "", bio: "" } })}>
          + New Author
        </button>
      )}
      <div className="divide-y divide-white/5 border border-white/10">
        {authors.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-gold to-gray-800 font-mono text-xs font-bold text-black">
              {a.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg text-white">{a.name}</p>
              <p className="font-mono text-xs text-gray-500">{a.title}</p>
            </div>
            <span className="font-mono text-xs text-gray-400">{counts[a.id] ?? 0} articles</span>
            <button
              type="button"
              className={buttonGhost}
              onClick={() => setEditing({ id: a.id, draft: { slug: a.slug, name: a.name, title: a.title ?? "", initials: a.initials ?? "", bio: a.bio ?? "" } })}
            >
              Edit
            </button>
            {confirm === a.id ? (
              <button type="button" disabled={pending} className={buttonDanger} onClick={() => run(() => deleteAuthor(a.id))}>
                Confirm delete
              </button>
            ) : (
              <button type="button" className={buttonDanger} onClick={() => setConfirm(a.id)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
