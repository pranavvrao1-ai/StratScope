import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles } from "@/lib/content/repository";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [articles, categories] = await Promise.all([getPublishedArticles(5000), getCategories()]);
  const latest = articles[0]?.updated_at;
  return [
    { url: `${base}/`, lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: articles.find((a) => a.category === c.slug)?.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${base}/articles/${a.slug}`,
      lastModified: a.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: a.hero_image ? [a.hero_image.startsWith("/") ? `${base}${a.hero_image}` : a.hero_image] : undefined,
    })),
  ];
}
