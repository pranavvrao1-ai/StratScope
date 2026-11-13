import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, ComingNextBanner } from "@/components/site/cards";
import { getArticlesByCategory, getCategories, getCategory } from "@/lib/content/repository";
import type { Category } from "@/lib/content/types";
import { COMING_NEXT, SITE } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not Found", robots: { index: false } };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${category.name} — StratScope`,
      description: category.description,
      url: `/category/${category.slug}`,
      siteName: SITE.name,
      images: [{ url: SITE.homeHeroImage, width: 739, height: 415, alt: "Missile launch at sea" }],
    },
  };
}

function InPreparation({ category }: { category: Category }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-ink py-24 md:py-36">
      <div className="mx-auto max-w-4xl space-y-8 px-6 text-center">
        <div aria-hidden className="relative mx-auto flex h-40 w-40 animate-pulse items-center justify-center rounded-full border border-dashed border-gold/40">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-solid border-gold/20">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
              <div className="h-2 w-2 rounded-full bg-gold" />
            </div>
          </div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-gold/30" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-gold/30" />
        </div>
        <div className="space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-gold">CLASSIFIED DOMAIN</span>
          <h1 className="font-serif text-3xl font-bold md:text-5xl">INTEL ANALYSIS IN PREPARATION</h1>
          <p className="mx-auto max-w-md font-sans text-sm leading-relaxed text-gray-400 md:text-base">
            Articles for this section are currently being researched and prepared.
          </p>
          <p className="pt-2 font-mono text-xs uppercase tracking-wider text-gray-600">{category.name}</p>
        </div>
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 font-mono text-xs uppercase tracking-widest text-white transition-all duration-300 hover:border-gold hover:text-gold"
          >
            <span>RETURN HOME</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const articles = await getArticlesByCategory(slug);

  if (articles.length === 0) return <InPreparation category={category} />;

  return (
    <div className="bg-ink">
      <section className="border-b border-white/10 py-24 md:py-32">
        <div className="mx-auto max-w-[120rem] px-6 md:px-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold">DOMAIN // {category.domain_code}</span>
          <h1 className="mt-2 font-serif text-4xl font-bold md:text-6xl">{category.name.toUpperCase()}</h1>
          <p className="mt-4 max-w-2xl text-gray-400">{category.description}</p>
        </div>
      </section>
      <section className="py-24">
        <div className="mx-auto max-w-[120rem] px-6 md:px-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} category={category} priority={i < 3} />
            ))}
          </div>
        </div>
      </section>
      {slug === COMING_NEXT.categorySlug && (
        <section className="border-t border-white/10 bg-abyss py-16 md:py-20">
          <div className="mx-auto max-w-[120rem] px-6 md:px-12">
            <ComingNextBanner />
          </div>
        </section>
      )}
    </div>
  );
}
