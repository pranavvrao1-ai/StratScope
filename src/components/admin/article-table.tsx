"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { deleteArticle, setArticleStatus, toggleFeatured } from "@/app/actions/admin";
import type { Category } from "@/lib/content/types";
import { Empty, StatusBadge, buttonDanger, buttonGhost, inputClass } from "./ui";

export interface AdminArticleRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "draft" | "published" | "scheduled";
  featured: boolean;
  published_date: string | null;
  scheduled_date: string | null;
  updated_at: string;
}

export function ArticleTable({ articles, categories }: { articles: AdminArticleRow[]; categories: Category[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const filtered = articles.filter(
    (a) =>
      (!query || a.title.toLowerCase().includes(query.toLowerCase()) || a.slug.includes(query.toLowerCase())) &&
      (status === "all" || a.status === status) &&
      (category === "all" || a.category === category),
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError("");
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Action failed");
      setConfirming(null);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search articles..." aria-label="Search articles" className={`${inputClass} md:max-w-sm`} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className={`${inputClass} md:w-48`}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className={`${inputClass} md:w-56`}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {filtered.length === 0 ? (
        <Empty>NO RECORDS FOUND</Empty>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-abyss font-mono text-[10px] uppercase tracking-widest text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articles/${a.id}`} className="font-serif text-base text-white hover:text-gold">
                      {a.title}
                    </Link>
                    <p className="font-mono text-[10px] text-gray-600">/{a.slug}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs capitalize text-gray-400">{a.category.replace(/-/g, " ")}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => toggleFeatured(a.id, !a.featured))}
                      aria-label={a.featured ? "Unfeature" : "Feature"}
                      aria-pressed={a.featured}
                      className="p-1"
                    >
                      <Star className={`h-4 w-4 ${a.featured ? "fill-gold text-gold" : "text-gray-600 hover:text-gold"}`} />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                    {a.status === "scheduled" ? a.scheduled_date?.slice(0, 16).replace("T", " ") : a.published_date ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/articles/${a.id}`} className={buttonGhost}>
                        Edit
                      </Link>
                      <Link href={`/admin/articles/${a.id}/preview`} className={buttonGhost}>
                        Preview
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        className={buttonGhost}
                        onClick={() => run(() => setArticleStatus(a.id, a.status === "published" ? "draft" : "published"))}
                      >
                        {a.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      {confirming === a.id ? (
                        <>
                          <button type="button" disabled={pending} className={buttonDanger} onClick={() => run(() => deleteArticle(a.id))}>
                            Confirm delete
                          </button>
                          <button type="button" className={buttonGhost} onClick={() => setConfirming(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button type="button" className={buttonDanger} onClick={() => setConfirming(a.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
