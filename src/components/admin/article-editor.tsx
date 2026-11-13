"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { saveArticle } from "@/app/actions/admin";
import type { Article, Author, Category, Specification } from "@/lib/content/types";
import { slugify } from "@/lib/slug";
import type { ArticleInput } from "@/lib/validation";
import { RichTextEditor } from "./rich-text-editor";
import { uploadImage } from "./upload";
import { StatusBadge, buttonGhost, buttonPrimary, inputClass, labelClass } from "./ui";

type FormState = ArticleInput;

function fromArticle(a: Article | null, categories: Category[], authors: Author[]): FormState {
  const defaultAuthor = authors[0] ?? null;
  return {
    title: a?.title ?? "",
    slug: a?.slug ?? "",
    excerpt: a?.excerpt ?? "",
    body: a?.body ?? "",
    category: a?.category ?? categories.find((c) => c.slug === "missile-technology")?.slug ?? categories[0]?.slug ?? "",
    author_id: a ? a.author_id : (defaultAuthor?.id ?? null),
    author_name: a?.author_name ?? defaultAuthor?.name ?? "Pranav V Rao",
    status: a?.status ?? "draft",
    featured: a?.featured ?? false,
    hero_image: a?.hero_image ?? "",
    hero_image_alt: a?.hero_image_alt ?? "",
    hero_image_credit: a?.hero_image_credit ?? "",
    gallery_images: a?.gallery_images ?? [],
    specifications: a?.specifications ?? [],
    source_references: a?.source_references ?? [],
    tags: a?.tags ?? [],
    seo_title: a?.seo_title ?? "",
    seo_description: a?.seo_description ?? "",
    published_date: a?.published_date ?? null,
    scheduled_date: a?.scheduled_date ?? null,
  };
}

/** datetime-local <-> ISO helpers (local time in the editor, UTC in the database). */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

function wordCount(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}

export function ArticleEditor({ article, categories, authors }: { article: Article | null; categories: Category[]; authors: Author[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => fromArticle(article, categories, authors));
  const [id, setId] = useState<string | null>(article?.id ?? null);
  const [savedStatus, setSavedStatus] = useState(article?.status ?? "draft");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [refDraft, setRefDraft] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = wordCount(form.body);
  const minutes = Math.max(1, Math.ceil(words / 200));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const persist = useCallback(
    async (data: FormState, auto: boolean) => {
      const res = await saveArticle(id, data);
      if (!res.ok) {
        if (!auto) setMessage({ kind: "error", text: res.error });
        return false;
      }
      const newId = res.data!.id;
      if (!id) {
        setId(newId);
        window.history.replaceState(null, "", `/admin/articles/${newId}`);
      }
      setSavedStatus(data.status);
      setDirty(false);
      setLastSaved(new Date());
      if (!auto) setMessage({ kind: "ok", text: data.status === "published" ? "Saved and published." : "Saved." });
      return true;
    },
    [id],
  );

  // Autosave drafts 5 s after the last change (published articles are only saved explicitly).
  useEffect(() => {
    if (!dirty || form.status !== "draft" || savedStatus !== "draft" || !form.title || !form.slug) return;
    autosaveTimer.current = setTimeout(() => void persist(form, true), 5000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [form, dirty, savedStatus, persist]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = (override?: Partial<FormState>) =>
    start(async () => {
      setMessage(null);
      const data = { ...form, ...override };
      if (override) setForm(data);
      const ok = await persist(data, false);
      if (ok) router.refresh();
    });

  const upload = async (kind: "hero" | "gallery", file: File | undefined) => {
    if (!file) return;
    setUploading(kind);
    setMessage(null);
    try {
      const url = await uploadImage(file);
      if (kind === "hero") set("hero_image", url);
      else set("gallery_images", [...form.gallery_images, url]);
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Image upload failed" });
    } finally {
      setUploading(null);
    }
  };

  const addTag = () => {
    const t = slugify(tagDraft);
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagDraft("");
  };

  const updateSpec = (i: number, key: keyof Specification, value: string) =>
    set(
      "specifications",
      form.specifications.map((s, j) => (j === i ? { ...s, [key]: value } : s)),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Articles
          </Link>
          <StatusBadge status={savedStatus} />
          <span className="font-mono text-[10px] text-gray-500">
            {words} words · {minutes} min read
            {lastSaved && ` · saved ${lastSaved.toLocaleTimeString()}`}
            {dirty && " · unsaved changes"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {id && (
            <Link href={`/admin/articles/${id}/preview`} target="_blank" className={buttonGhost}>
              Preview ↗
            </Link>
          )}
          {savedStatus === "published" && (
            <Link href={`/articles/${form.slug}`} target="_blank" className={buttonGhost}>
              View live ↗
            </Link>
          )}
          <button type="button" disabled={pending} onClick={() => save()} className={buttonGhost}>
            {pending ? "Saving…" : "Save"}
          </button>
          {form.status !== "published" ? (
            <button type="button" disabled={pending} onClick={() => save({ status: "published" })} className={buttonPrimary}>
              Publish
            </button>
          ) : (
            savedStatus === "published" && (
              <button type="button" disabled={pending} onClick={() => save({ status: "draft" })} className={buttonGhost}>
                Unpublish
              </button>
            )
          )}
        </div>
      </div>

      {message && (
        <p role="status" className={`border p-3 text-sm ${message.kind === "ok" ? "border-emerald-700/50 text-emerald-400" : "border-red-500/40 text-red-400"}`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* Main column */}
        <div className="space-y-6 xl:col-span-8">
          <input
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
              setDirty(true);
            }}
            placeholder="ENTER INTEL REPORT TITLE..."
            aria-label="Title"
            className="w-full border-b border-white/10 bg-transparent py-4 font-serif text-3xl text-white placeholder-gray-700 focus:border-gold focus:outline-none md:text-4xl"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="slug" className={labelClass}>
                Slug
              </label>
              <input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value.toLowerCase());
                }}
                placeholder="url-slug"
                className={`${inputClass} font-mono`}
              />
              {savedStatus === "published" && article && form.slug !== article.slug && (
                <p className="mt-1 text-xs text-yellow-500">Changing a published slug breaks existing links to this article.</p>
              )}
            </div>
            <div>
              <label htmlFor="category" className={labelClass}>
                Category
              </label>
              <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="excerpt" className={labelClass}>
              Excerpt
            </label>
            <textarea id="excerpt" rows={3} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Brief summary..." className={`${inputClass} resize-y`} />
          </div>
          <div>
            <span className={labelClass}>Article Body</span>
            <RichTextEditor value={form.body} onChange={(html) => set("body", html)} />
            <p className="mt-1 font-mono text-[10px] text-gray-600">Drag, paste or use the image button to upload images into the body.</p>
          </div>

          {/* Specifications */}
          <section className="space-y-3 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Specifications</h2>
              <button type="button" className={buttonGhost} onClick={() => set("specifications", [...form.specifications, { parameter: "", sub_class: "", value: "" }])}>
                <Plus className="inline h-3 w-3" /> Row
              </button>
            </div>
            {form.specifications.length === 0 && <p className="text-xs text-gray-600">No specifications. Rows appear as the “Tactical Parameter Index” table.</p>}
            {form.specifications.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_auto] gap-2">
                <input aria-label="Parameter" value={s.parameter} onChange={(e) => updateSpec(i, "parameter", e.target.value)} placeholder="Parameter" className={inputClass} />
                <input aria-label="Sub-class" value={s.sub_class} onChange={(e) => updateSpec(i, "sub_class", e.target.value)} placeholder="Sub-class" className={inputClass} />
                <input aria-label="Value" value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} placeholder="Value" className={inputClass} />
                <button type="button" aria-label="Remove row" onClick={() => set("specifications", form.specifications.filter((_, j) => j !== i))} className="px-2 text-gray-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>

          {/* References */}
          <section className="space-y-3 border border-white/10 p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gold">References</h2>
            <ol className="space-y-2">
              {form.source_references.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="pt-2 font-mono text-xs text-gray-600">{i + 1}.</span>
                  <input
                    aria-label={`Reference ${i + 1}`}
                    value={r}
                    onChange={(e) => set("source_references", form.source_references.map((x, j) => (j === i ? e.target.value : x)))}
                    className={inputClass}
                  />
                  <button type="button" aria-label="Remove reference" onClick={() => set("source_references", form.source_references.filter((_, j) => j !== i))} className="px-2 text-gray-500 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
            <div className="flex gap-2">
              <input
                value={refDraft}
                onChange={(e) => setRefDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (refDraft.trim()) set("source_references", [...form.source_references, refDraft.trim()]);
                    setRefDraft("");
                  }
                }}
                placeholder="Reference source..."
                aria-label="New reference"
                className={inputClass}
              />
              <button
                type="button"
                className={buttonGhost}
                onClick={() => {
                  if (refDraft.trim()) set("source_references", [...form.source_references, refDraft.trim()]);
                  setRefDraft("");
                }}
              >
                Add
              </button>
            </div>
          </section>

          {/* Gallery */}
          <section className="space-y-3 border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Gallery Images</h2>
              <label className={`${buttonGhost} cursor-pointer`}>
                {uploading === "gallery" ? "Uploading…" : "+ Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void upload("gallery", e.target.files?.[0])} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {form.gallery_images.map((src, i) => (
                <div key={src + i} className="group relative aspect-video border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={() => set("gallery_images", form.gallery_images.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 bg-black/70 p-1 text-gray-300 hover:text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 xl:col-span-4">
          <section className="space-y-4 border border-white/10 p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Publishing</h2>
            <div>
              <label htmlFor="status" className={labelClass}>
                Status
              </label>
              <select id="status" value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])} className={inputClass}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            {form.status === "scheduled" && (
              <div>
                <label htmlFor="scheduled" className={labelClass}>
                  Scheduled date
                </label>
                <input
                  id="scheduled"
                  type="datetime-local"
                  value={toLocalInput(form.scheduled_date)}
                  onChange={(e) => set("scheduled_date", fromLocalInput(e.target.value))}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-gray-500">Becomes visible automatically at this time (pages refresh within 5 minutes).</p>
              </div>
            )}
            <div>
              <label htmlFor="published" className={labelClass}>
                Published date
              </label>
              <input id="published" type="date" value={form.published_date ?? ""} onChange={(e) => set("published_date", e.target.value || null)} className={inputClass} />
              <p className="mt-1 text-[11px] text-gray-500">Set automatically to today on first publish if left empty.</p>
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[#D4AF37]" />
              Featured Article
            </label>
          </section>

          <section className="space-y-4 border border-white/10 p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Author</h2>
            <select
              aria-label="Author"
              value={form.author_id ?? ""}
              onChange={(e) => {
                const a = authors.find((x) => x.id === e.target.value);
                setForm((f) => ({ ...f, author_id: a?.id ?? null, author_name: a?.name ?? f.author_name }));
                setDirty(true);
              }}
              className={inputClass}
            >
              <option value="">— Unlinked —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-4 border border-white/10 p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Hero Image</h2>
            {form.hero_image ? (
              <div className="relative aspect-video border border-white/10 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.hero_image} alt="" className="h-full w-full object-contain" />
                <button type="button" aria-label="Remove hero image" onClick={() => set("hero_image", "")} className="absolute right-1 top-1 bg-black/70 p-1 text-gray-300 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer items-center justify-center border border-dashed border-white/15 font-mono text-[11px] uppercase tracking-widest text-gray-500 hover:border-gold hover:text-gold">
                {uploading === "hero" ? "Uploading…" : "Upload hero image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => void upload("hero", e.target.files?.[0])} />
              </label>
            )}
            <div>
              <label htmlFor="hero-alt" className={labelClass}>
                Alt text
              </label>
              <input id="hero-alt" value={form.hero_image_alt} onChange={(e) => set("hero_image_alt", e.target.value)} placeholder="Describe the image" className={inputClass} />
            </div>
            <div>
              <label htmlFor="hero-credit" className={labelClass}>
                Credit / attribution
              </label>
              <input id="hero-credit" value={form.hero_image_credit} onChange={(e) => set("hero_image_credit", e.target.value)} placeholder="e.g. Photo: Ministry of Defence" className={inputClass} />
            </div>
          </section>

          <section className="space-y-3 border border-white/10 p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gold">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 border border-white/10 px-2 py-1 font-mono text-[11px] text-gray-300">
                  {t}
                  <button type="button" aria-label={`Remove tag ${t}`} onClick={() => set("tags", form.tags.filter((x) => x !== t))} className="text-gray-500 hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag..."
                aria-label="New tag"
                className={inputClass}
              />
              <button type="button" className={buttonGhost} onClick={addTag}>
                Add
              </button>
            </div>
          </section>

          <section className="space-y-4 border border-white/10 p-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gold">SEO Metadata</h2>
            <div>
              <label htmlFor="seo-title" className={labelClass}>
                SEO Title <span className="text-gray-600">({form.seo_title.length}/60 recommended)</span>
              </label>
              <input id="seo-title" value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder="SEO title..." className={inputClass} />
            </div>
            <div>
              <label htmlFor="seo-desc" className={labelClass}>
                SEO Description <span className="text-gray-600">({form.seo_description.length}/160 recommended)</span>
              </label>
              <textarea id="seo-desc" rows={3} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} placeholder="Meta description..." className={`${inputClass} resize-y`} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
