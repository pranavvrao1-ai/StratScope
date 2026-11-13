import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/site/article-view";
import { Comments } from "@/components/site/comments";
import { JsonLd } from "@/components/site/json-ld";
import {
  getArticleBySlug,
  getAuthor,
  getCategory,
  getComments,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/content/repository";
import { SITE, siteUrl } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPublishedArticles(500)).map((a) => ({ slug: a.slug }));
}

/** The original stored seo_title values already end in "— StratScope"; avoid doubling the suffix. */
function seoTitle(seo: string, title: string): string {
  return (seo || title).replace(/\s*[—-]\s*StratScope\s*$/i, "");
}

export async function generateMetadata({ params }: PageProps<"/articles/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Report Not Found", robots: { index: false } };
  const title = seoTitle(article.seo_title, article.title);
  const description = article.seo_description || article.excerpt || SITE.socialDescription;
  const image = article.hero_image || SITE.homeHeroImage;
  return {
    title,
    description,
    keywords: article.tags,
    authors: [{ name: article.author_name || SITE.founder }],
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/articles/${article.slug}`,
      siteName: SITE.name,
      publishedTime: article.published_date ?? undefined,
      modifiedTime: article.updated_at,
      authors: [article.author_name || SITE.founder],
      section: article.category,
      tags: article.tags,
      images: [{ url: image, alt: article.hero_image_alt || article.title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ArticlePage({ params }: PageProps<"/articles/[slug]">) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [category, author, comments, related] = await Promise.all([
    getCategory(article.category),
    getAuthor(article.author_id),
    getComments(article.id),
    getRelatedArticles(article, 3),
  ]);
  const url = `${siteUrl()}/articles/${article.slug}`;
  const image = article.hero_image || SITE.homeHeroImage;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.seo_description || article.excerpt,
          image: [image.startsWith("/") ? `${siteUrl()}${image}` : image],
          datePublished: article.published_date ?? undefined,
          dateModified: article.updated_at,
          author: { "@type": "Person", name: author?.name || article.author_name || SITE.founder },
          publisher: {
            "@type": "Organization",
            name: SITE.name,
            logo: { "@type": "ImageObject", url: `${siteUrl()}${SITE.logoPath}` },
          },
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          articleSection: category?.name ?? article.category,
          keywords: article.tags.join(", "),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
            { "@type": "ListItem", position: 2, name: category?.name ?? article.category, item: `${siteUrl()}/category/${article.category}` },
            { "@type": "ListItem", position: 3, name: article.title, item: url },
          ],
        }}
      />
      <ArticleView article={article} category={category} author={author} url={url} />
      <Comments articleId={article.id} initial={comments} />
      {related.length > 0 && (
        <section className="border-t border-white/10 bg-abyss py-24" aria-labelledby="related-heading">
          <div className="mx-auto max-w-[120rem] px-6 md:px-12">
            <h2 id="related-heading" className="mb-12 font-serif text-3xl font-bold md:text-4xl">
              RELATED INTELLIGENCE
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/articles/${r.slug}`} className="group border border-white/10 p-6 transition-all hover:border-gold/50">
                  <span className="font-mono text-xs uppercase text-gold">{r.category.replace(/-/g, " ")}</span>
                  <h3 className="mt-2 font-serif text-xl font-bold text-white group-hover:text-gold">{r.title}</h3>
                  <p className="mt-4 font-mono text-xs text-gray-500">{r.reading_time || 0} MIN READ →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
