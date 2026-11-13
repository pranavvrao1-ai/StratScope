import "server-only";
import { cache } from "react";
import { contentSource } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";
import seed from "./seed-data.json";
import type { Article, ArticleSummary, Author, Category, Comment } from "./types";

// Public, read-only content access. Every function returns only content that is
// publicly visible (published, or scheduled and due). Supabase RLS enforces the
// same rule in the database; the filter here keeps seed mode identical.

const SUMMARY_COLUMNS =
  "id, slug, title, excerpt, category, hero_image, hero_image_alt, reading_time, published_date, updated_at, featured, tags";

const seedArticles = seed.articles as unknown as Article[];
const seedCategories = seed.categories as Category[];
const seedAuthors = seed.authors as Author[];
const seedComments = seed.comments as unknown as (Comment & { is_hidden: boolean })[];

function isPublic(a: Pick<Article, "status" | "scheduled_date">, now = Date.now()): boolean {
  return (
    a.status === "published" ||
    (a.status === "scheduled" && !!a.scheduled_date && new Date(a.scheduled_date).getTime() <= now)
  );
}

function byPublishedDesc(a: { published_date: string | null }, b: { published_date: string | null }) {
  return (b.published_date ?? "").localeCompare(a.published_date ?? "");
}

function toSummary(a: Article): ArticleSummary {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    hero_image: a.hero_image,
    hero_image_alt: a.hero_image_alt,
    reading_time: a.reading_time,
    published_date: a.published_date,
    updated_at: a.updated_at,
    featured: a.featured,
    tags: a.tags,
  };
}

const visibleFilter = () =>
  `status.eq.published,and(status.eq.scheduled,scheduled_date.lte.${new Date().toISOString()})`;

export const getCategories = cache(async (): Promise<Category[]> => {
  if (contentSource() === "seed") return [...seedCategories].sort((a, b) => a.sort_order - b.sort_order);
  const { data, error } = await publicClient().from("categories").select("*").order("sort_order");
  if (error) throw new Error(`categories: ${error.message}`);
  return data as Category[];
});

export async function getCategory(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export const getPublishedArticles = cache(async (limit = 100): Promise<ArticleSummary[]> => {
  if (contentSource() === "seed") {
    return seedArticles.filter((a) => isPublic(a)).sort(byPublishedDesc).slice(0, limit).map(toSummary);
  }
  const { data, error } = await publicClient()
    .from("articles")
    .select(SUMMARY_COLUMNS)
    .or(visibleFilter())
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`articles: ${error.message}`);
  return data as ArticleSummary[];
});

export async function getArticlesByCategory(category: string): Promise<ArticleSummary[]> {
  return (await getPublishedArticles(500)).filter((a) => a.category === category);
}

export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  if (contentSource() === "seed") {
    return seedArticles.find((a) => a.slug === slug && isPublic(a)) ?? null;
  }
  const { data, error } = await publicClient()
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .or(visibleFilter())
    .maybeSingle();
  if (error) throw new Error(`article: ${error.message}`);
  return (data as Article) ?? null;
});

export const getAuthor = cache(async (id: string | null): Promise<Author | null> => {
  if (!id) return null;
  if (contentSource() === "seed") return seedAuthors.find((a) => a.id === id) ?? null;
  const { data } = await publicClient().from("authors").select("*").eq("id", id).maybeSingle();
  return (data as Author) ?? null;
});

/** Same category first (as the original), then articles sharing tags. */
export async function getRelatedArticles(article: Article, limit = 3): Promise<ArticleSummary[]> {
  const all = (await getPublishedArticles(500)).filter((a) => a.id !== article.id);
  const tags = new Set(article.tags);
  const score = (a: ArticleSummary) =>
    (a.category === article.category ? 100 : 0) + a.tags.filter((t) => tags.has(t)).length;
  return all
    .map((a) => ({ a, s: score(a) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s || byPublishedDesc(x.a, y.a))
    .slice(0, limit)
    .map((x) => x.a);
}

export async function getComments(articleId: string): Promise<Comment[]> {
  if (contentSource() === "seed") {
    return seedComments
      .filter((c) => c.article_id === articleId && !c.is_hidden)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(({ id, article_id, author_name, content, likes, created_at }) => ({ id, article_id, author_name, content, likes, created_at }));
  }
  const { data, error } = await publicClient()
    .from("comments")
    .select("id, article_id, author_name, content, likes, created_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`comments: ${error.message}`);
  return data as Comment[];
}

/** Top tags by frequency across published articles (Home → Trending Topics). */
export async function getTrendingTags(limit = 12): Promise<string[]> {
  const counts = new Map<string, number>();
  for (const a of await getPublishedArticles(500)) for (const t of a.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
}
