"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchIndex {
  articles: { slug: string; title: string; excerpt: string; category: string }[];
  categories: { slug: string; name: string }[];
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const loading = open && index === null;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    if (!index) {
      fetch("/api/search-index")
        .then((r) => (r.ok ? r.json() : { articles: [], categories: [] }))
        .then((data: SearchIndex) => setIndex(data))
        .catch(() => setIndex({ articles: [], categories: [] }));
    }
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, index, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const articles = (index?.articles ?? []).filter(
    (a) => !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.category.toLowerCase().includes(q),
  );
  const categories = q
    ? (index?.categories ?? []).filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q))
    : [];

  const close = () => {
    setQuery("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20" onClick={close} role="presentation">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative z-10 w-full max-w-2xl border border-white/10 bg-abyss shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 border-b border-white/10 px-6 py-4">
          <Search className="h-5 w-5 text-gold" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH INTELLIGENCE DATABASE..."
            aria-label="Search articles and categories"
            className="flex-1 bg-transparent font-mono text-sm text-white placeholder-gray-600 focus:outline-none"
          />
          <button type="button" onClick={close} className="text-gray-500 hover:text-white" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && <p className="px-6 py-8 text-center font-mono text-xs text-gray-500">SCANNING DATABASE...</p>}
          {!loading && articles.length === 0 && categories.length === 0 && (
            <p className="px-6 py-8 text-center font-mono text-xs text-gray-500">NO RESULTS FOUND. TRY DIFFERENT PARAMETERS.</p>
          )}
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/articles/${a.slug}`}
              onClick={close}
              className="block border-b border-white/5 px-6 py-4 transition-colors hover:bg-white/5"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-gold">{a.category.replace(/-/g, " ")}</span>
              <h4 className="mt-1 font-serif text-lg text-white">{a.title}</h4>
              {a.excerpt && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{a.excerpt}</p>}
            </Link>
          ))}
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={close}
              className="block border-b border-white/5 px-6 py-4 transition-colors hover:bg-white/5"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-500">CATEGORY</span>
              <h4 className="mt-1 font-serif text-lg text-white">{c.name}</h4>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
