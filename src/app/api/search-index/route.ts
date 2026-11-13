import { NextResponse } from "next/server";
import { getCategories, getPublishedArticles } from "@/lib/content/repository";

export const revalidate = 300;

/** Lightweight index for the client-side search dialog (published content only). */
export async function GET() {
  const [articles, categories] = await Promise.all([getPublishedArticles(500), getCategories()]);
  return NextResponse.json({
    articles: articles.map(({ slug, title, excerpt, category }) => ({ slug, title, excerpt, category })),
    categories: categories.map(({ slug, name }) => ({ slug, name })),
  });
}
