"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import type { Category } from "@/lib/content/types";
import { slugify } from "@/lib/slug";
import { buttonDanger, buttonGhost, buttonPrimary, inputClass, labelClass } from "./ui";

type Draft = Omit<Category, "sort_order"> & { sort_order: number };

const blank = (order: number): Draft => ({
  slug: "",
  name: "",
  short_name: "",
  domain_code: String(order).padStart(2, "0"),
  description: "",
  coming_soon_title: "",
  coming_soon_description: "",
  sort_order: order,
});

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ original: string | null; draft: Draft } | null>(null);
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

  const field = (key: keyof Draft, label: string, textarea = false) =>
    editing && (
      <div>
        <label className={labelClass} htmlFor={`cat-${key}`}>
          {label}
        </label>
        {textarea ? (
          <textarea
            id={`cat-${key}`}
            rows={2}
            value={String(editing.draft[key])}
            onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, [key]: e.target.value } })}
            className={inputClass}
          />
        ) : (
          <input
            id={`cat-${key}`}
            value={String(editing.draft[key])}
            onChange={(e) => {
              const v = key === "sort_order" ? Number(e.target.value) || 0 : e.target.value;
              const draft = { ...editing.draft, [key]: v };
              if (key === "name" && editing.original === null) draft.slug = slugify(String(v));
              setEditing({ ...editing, draft });
            }}
            className={inputClass}
          />
        )}
      </div>
    );

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {editing ? (
        <form
          className="space-y-4 border border-gold/30 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => saveCategory(editing.original, editing.draft), () => setEditing(null));
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {field("name", "Name")}
            {field("short_name", "Navigation label")}
            {field("slug", "Slug")}
            {field("domain_code", "Domain code")}
            {field("sort_order", "Sort order")}
          </div>
          {field("description", "Description", true)}
          {field("coming_soon_title", "“Coming soon” title (shown when no articles)")}
          {field("coming_soon_description", "“Coming soon” description", true)}
          {editing.original && editing.draft.slug !== editing.original && (
            <p className="text-xs text-yellow-500">Changing the slug changes the URL /category/{editing.original}. Articles move with it automatically.</p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className={buttonPrimary}>
              Save category
            </button>
            <button type="button" className={buttonGhost} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={buttonPrimary} onClick={() => setEditing({ original: null, draft: blank(categories.length + 1) })}>
          + New Category
        </button>
      )}

      <div className="divide-y divide-white/5 border border-white/10">
        {categories.map((c) => (
          <div key={c.slug} className="flex flex-wrap items-center gap-4 p-4">
            <span className="font-mono text-xs text-gray-500">{c.domain_code}</span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg text-white">
                {c.name} <span className="font-mono text-[10px] text-gray-500">/category/{c.slug}</span>
              </p>
              <p className="text-xs text-gray-500">{c.description}</p>
            </div>
            <span className="font-mono text-xs text-gray-400">{counts[c.slug] ?? 0} articles</span>
            <button type="button" className={buttonGhost} onClick={() => setEditing({ original: c.slug, draft: { ...c } })}>
              Edit
            </button>
            {confirm === c.slug ? (
              <button type="button" disabled={pending} className={buttonDanger} onClick={() => run(() => deleteCategory(c.slug))}>
                Confirm delete
              </button>
            ) : (
              <button type="button" className={buttonDanger} onClick={() => setConfirm(c.slug)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
