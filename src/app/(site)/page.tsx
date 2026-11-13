import Link from "next/link";
import Image from "next/image";
import { ArticleCard, ComingNextBanner, ComingSoonCard } from "@/components/site/cards";
import { NewsletterSection } from "@/components/site/newsletter";
import { JsonLd } from "@/components/site/json-ld";
import { getCategories, getPublishedArticles, getTrendingTags } from "@/lib/content/repository";
import { SITE, siteUrl } from "@/lib/site";

export const revalidate = 300;

export default async function HomePage() {
  const [articles, categories, trending] = await Promise.all([getPublishedArticles(100), getCategories(), getTrendingTags(12)]);
  const covered = new Set(articles.map((a) => a.category));
  const inPreparation = categories.filter((c) => !covered.has(c.slug));
  const latest = articles[0];
  const categoryOf = (slug: string) => categories.find((c) => c.slug === slug);

  return (
    <div className="bg-ink">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${siteUrl()}/#organization`,
              name: SITE.name,
              url: siteUrl(),
              logo: `${siteUrl()}${SITE.logoPath}`,
              founder: { "@type": "Person", name: SITE.founder },
            },
            {
              "@type": "WebSite",
              "@id": `${siteUrl()}/#website`,
              url: siteUrl(),
              name: SITE.name,
              description: SITE.socialDescription,
              publisher: { "@id": `${siteUrl()}/#organization` },
            },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <Image src={SITE.homeHeroImage} alt="Missile launch at sea" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink/90" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-20 text-center md:px-12 lg:py-32">
          <div className="space-y-8">
            <span className="inline-block font-mono text-xs uppercase tracking-[0.3em] text-gold">StratScope · Defence Technology Publication</span>
            <h1 className="font-serif text-4xl font-bold leading-[1.1] text-white md:text-5xl lg:text-6xl">
              Understanding Defence Technology,
              <br className="hidden md:block" /> One Platform at a Time.
            </h1>
            <div className="mx-auto h-px w-16 bg-gold" />
            <p className="mx-auto max-w-3xl font-sans text-base leading-relaxed text-gray-300 md:text-lg">
              StratScope is an independent defence technology publication and knowledge base dedicated to documenting military systems,
              aerospace, naval platforms, missile technology, cybersecurity, space systems, and emerging technologies through publicly
              available information.
            </p>
            <p className="mx-auto max-w-2xl font-sans text-sm leading-relaxed text-gray-500 md:text-base">
              Founded and maintained by Pranav V Rao, StratScope exists to make complex defence technologies more accessible to students,
              researchers, and defence enthusiasts around the world.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <a
                href="#latest"
                className="inline-flex items-center bg-gold px-8 py-4 font-sans text-sm font-medium tracking-wide text-abyss transition-colors hover:bg-white"
              >
                Explore Articles
              </a>
              <Link
                href="/about"
                className="inline-flex items-center border border-white/20 px-8 py-4 font-sans text-sm font-medium tracking-wide text-white transition-colors hover:border-gold"
              >
                About StratScope
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest article strip */}
      {latest && (
        <Link
          href={`/articles/${latest.slug}`}
          className="group block border-b border-white/10 bg-gradient-to-r from-abyss via-ink to-abyss transition-all hover:to-abyss"
        >
          <div className="mx-auto flex max-w-[120rem] flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:gap-8 md:px-12 md:py-8">
            <div className="flex shrink-0 items-center gap-4">
              <span className="bg-gold px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-abyss">New</span>
              <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-gray-500 sm:block">Latest Article</span>
            </div>
            <div className="flex flex-grow flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-white transition-colors group-hover:text-gold md:text-2xl">{latest.title}</h2>
                <span className="font-sans text-xs capitalize text-gray-500">
                  {latest.category.replace(/-/g, " ")} · {latest.reading_time || 0} min read
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-2 font-sans text-sm text-gold transition-colors group-hover:text-white">
                Read Now <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Coming next */}
      <section className="border-b border-white/10 bg-abyss py-16 md:py-20">
        <div className="mx-auto max-w-[120rem] px-6 md:px-12">
          <ComingNextBanner />
        </div>
      </section>

      {/* Latest articles */}
      <section id="latest" className="scroll-mt-20 border-b border-white/10 py-24 md:py-32">
        <div className="mx-auto max-w-[120rem] px-6 md:px-12">
          <div className="mb-16 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <h2 className="font-serif text-3xl font-bold text-white md:text-5xl">Latest Articles</h2>
            <p className="font-sans text-sm text-gray-500">
              {articles.length} published · {inPreparation.length} in preparation
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} category={categoryOf(a.category)} priority={i < 3} />
            ))}
            {inPreparation.map((c) => (
              <ComingSoonCard key={c.slug} category={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="border-b border-white/10 bg-abyss py-24 md:py-32">
        <div className="mx-auto max-w-[120rem] px-6 md:px-12">
          <div className="mb-16">
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Browse by topic</span>
            <h2 className="mt-2 font-serif text-4xl font-bold text-white md:text-6xl">Explore Categories</h2>
          </div>
          <div className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group flex min-h-[220px] flex-col justify-between bg-ink p-8 transition-all duration-300 hover:bg-abyss md:p-12"
              >
                <span className="font-mono text-xs text-gray-500 transition-colors group-hover:text-gold">{c.domain_code}</span>
                <div className="mt-auto space-y-4 pt-8">
                  <h3 className="font-serif text-2xl font-bold text-white md:text-3xl">{c.name}</h3>
                  <p className="font-sans text-sm text-gray-400">{c.description}</p>
                </div>
                <span className="mt-4 font-mono text-xs text-gold opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {covered.has(c.slug) ? "Read articles →" : "Coming soon →"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending topics */}
      {trending.length > 0 && (
        <section className="border-b border-white/10 py-24 md:py-32">
          <div className="mx-auto max-w-[120rem] px-6 md:px-12">
            <h2 className="mb-12 font-serif text-3xl font-bold text-white md:text-5xl">Trending Topics</h2>
            <ul className="flex flex-wrap gap-3">
              {trending.map((t) => (
                <li
                  key={t}
                  className="cursor-default border border-white/10 px-5 py-2.5 font-sans text-sm capitalize text-gray-400 transition-colors hover:border-gold hover:text-white"
                >
                  {t.replace(/-/g, " ")}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <NewsletterSection />
    </div>
  );
}
