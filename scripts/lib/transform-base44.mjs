// Pure transformation from the raw Base44 export to StratScope's schema.
// Shared by build-seed.mjs (seed JSON + seed.sql) and verify-migration.mjs.
// No content is rewritten: only identifiers, column names and media URLs change.
import { createHash } from "node:crypto";

export const BASE44_MEDIA_PREFIX =
  "https://media.base44.com/images/public/6a5791d01a8c87f21561df5f/";
export const MIGRATED_MEDIA_PREFIX = "/images/migrated/";

/** Deterministic UUID derived from a Base44 id, so re-running the import is idempotent. */
export function legacyUuid(kind, legacyId) {
  const h = createHash("sha1").update(`stratscope:${kind}:${legacyId}`).digest("hex");
  // Format as RFC 4122 v5-style UUID.
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function rewriteMediaUrl(url) {
  if (typeof url !== "string" || url === "") return "";
  return url.startsWith(BASE44_MEDIA_PREFIX)
    ? MIGRATED_MEDIA_PREFIX + url.slice(BASE44_MEDIA_PREFIX.length)
    : url;
}

export function rewriteMediaInHtml(html) {
  return (html ?? "").split(BASE44_MEDIA_PREFIX).join(MIGRATED_MEDIA_PREFIX);
}

const toIso = (d) => (d ? (d.endsWith("Z") || /[+-]\d\d:\d\d$/.test(d) ? d : `${d}Z`) : null);

export function transformCategories(staticContent) {
  return staticContent.categories.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    short_name: c.short,
    domain_code: c.domain,
    description: c.description,
    coming_soon_title: c.comingSoonTitle,
    coming_soon_description: c.comingSoonDesc,
    sort_order: i + 1,
  }));
}

export function transformAuthors(staticContent) {
  return staticContent.authors.map((a) => ({
    id: legacyUuid("author", a.slug),
    slug: a.slug,
    name: a.name,
    title: a.title,
    initials: a.initials,
    bio: "",
  }));
}

export function transformArticles(rawArticles, authors) {
  return rawArticles.map((a) => {
    const author = authors.find((x) => x.name === a.author) ?? null;
    return {
      id: legacyUuid("article", a.id),
      legacy_id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt ?? "",
      body: rewriteMediaInHtml(a.body),
      category: a.category,
      author_id: author ? author.id : null,
      author_name: a.author ?? "",
      status: a.status ?? "draft",
      featured: Boolean(a.featured),
      hero_image: rewriteMediaUrl(a.hero_image),
      hero_image_alt: "",
      hero_image_credit: "",
      gallery_images: (a.gallery_images ?? []).map(rewriteMediaUrl),
      specifications: (a.specifications ?? []).map((s) => ({
        parameter: s.parameter ?? "",
        sub_class: s.sub_class ?? "",
        value: s.value ?? "",
      })),
      source_references: a.references ?? [],
      tags: a.tags ?? [],
      seo_title: a.seo_title ?? "",
      seo_description: a.seo_description ?? "",
      reading_time: Math.round(Number(a.reading_time ?? 0)),
      published_date: a.published_date ?? null,
      scheduled_date: toIso(a.scheduled_date),
      created_at: toIso(a.created_date),
      updated_at: toIso(a.updated_date),
    };
  });
}

export function transformComments(rawComments) {
  return rawComments.map((c) => ({
    id: legacyUuid("comment", c.id),
    legacy_id: c.id,
    article_id: legacyUuid("article", c.article_id),
    author_name: c.author_name,
    content: c.content,
    likes: Number(c.likes ?? 0),
    is_hidden: false,
    created_at: toIso(c.created_date),
  }));
}

export function transformAll({ articles, comments, staticContent }) {
  const authors = transformAuthors(staticContent);
  return {
    categories: transformCategories(staticContent),
    authors,
    articles: transformArticles(articles, authors),
    comments: transformComments(comments),
  };
}
