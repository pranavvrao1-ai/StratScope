import Link from "next/link";
import type { Article, Author, Category } from "@/lib/content/types";
import { prepareArticleBody } from "@/lib/html";
import { formatLongDate } from "@/lib/format";
import { MediaImage } from "./media-image";
import { ShareLinks } from "./share-links";

interface Props {
  article: Article;
  category: Category | null;
  author: Author | null;
  url: string;
}

/** Article layout reproduced from the original StratScope article page. */
export function ArticleView({ article, category, author, url }: Props) {
  const { html, toc } = prepareArticleBody(article.body);
  const authorName = author?.name || article.author_name || "Pranav V Rao";
  const authorTitle = author?.title ?? "Founder & Editor-in-Chief, StratScope";
  const authorInitials = author?.initials || "PVR";

  return (
    <article className="bg-ink">
      <header className="border-b border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-4xl space-y-8 px-6">
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-gray-400">
            <Link href={`/category/${article.category}`} className="uppercase tracking-wider text-gold hover:text-white">
              {(category?.name || article.category).toUpperCase()}
            </Link>
            <span aria-hidden>•</span>
            <span>
              PUBLISHED:{" "}
              {article.published_date ? (
                <time dateTime={article.published_date}>{formatLongDate(article.published_date).toUpperCase()}</time>
              ) : (
                "—"
              )}
            </span>
            <span aria-hidden>•</span>
            <span className="border border-gold/30 px-2 py-0.5 text-gold">OPEN INTEL</span>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">{article.title}</h1>
          {article.excerpt && <p className="text-lg leading-relaxed text-gray-400 md:text-xl">{article.excerpt}</p>}
          <div className="flex items-center gap-4 border-t border-white/10 pt-4">
            <div
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-gold to-gray-800 font-mono text-xs font-bold text-black"
            >
              {authorInitials}
            </div>
            <div>
              <p className="text-sm font-bold text-white" rel="author">
                {authorName}
              </p>
              {authorTitle && <p className="font-mono text-xs text-gray-400">{authorTitle}</p>}
            </div>
            <div className="ml-auto font-mono text-xs text-gray-500">{article.reading_time || 0} MIN READ</div>
          </div>
        </div>
      </header>

      {article.hero_image && (
        <figure className="mx-auto -mt-8 max-w-6xl px-6">
          <div className="relative aspect-video overflow-hidden rounded-md border border-white/10 bg-black">
            <MediaImage
              src={article.hero_image}
              alt={article.hero_image_alt || article.title}
              fill
              priority
              sizes="(min-width: 1152px) 1104px, 100vw"
              className="object-contain"
            />
          </div>
          {article.hero_image_credit && (
            <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-wider text-gray-500">{article.hero_image_credit}</figcaption>
          )}
        </figure>
      )}

      <div className="py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-28 space-y-8">
              {toc.length > 0 && (
                <nav aria-label="Table of contents" className="border-l-2 border-gold pl-4">
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-gold">SYSTEM INDEX</h2>
                  <ol className="space-y-3 font-mono text-xs text-gray-400">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === "h3" ? "pl-3" : ""}>
                        <a href={`#${item.id}`} className="block transition-colors hover:text-white">
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <ShareLinks url={url} title={article.title} />
            </div>
          </aside>

          <div className="space-y-16 lg:col-span-9">
            {/* Body HTML is sanitised server-side by prepareArticleBody (allow-list). */}
            <div className="article-body font-sans text-lg leading-relaxed text-gray-300" dangerouslySetInnerHTML={{ __html: html }} />

            {article.gallery_images.length > 0 && (
              <section className="space-y-6" aria-labelledby="gallery-heading">
                <h2 id="gallery-heading" className="border-b border-white/10 pb-4 font-mono text-xs uppercase tracking-widest text-gold">
                  VISUAL INTELLIGENCE
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {article.gallery_images.map((src, i) => (
                    <div key={src + i} className="relative aspect-video overflow-hidden border border-white/10 bg-black">
                      <MediaImage src={src} alt={`${article.title} — gallery image ${i + 1}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {article.specifications.length > 0 && (
              <section id="specifications" className="space-y-6 border border-white/10 bg-abyss/60 p-6 md:p-8" aria-labelledby="specs-heading">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <span className="font-mono text-xs text-gold">TABLE 1.0</span>
                  <h2 id="specs-heading" className="font-serif text-xl font-bold">
                    TACTICAL PARAMETER INDEX
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-500">
                        <th scope="col" className="px-4 py-3">PARAMETER</th>
                        <th scope="col" className="px-4 py-3">SUB-CLASS</th>
                        <th scope="col" className="px-4 py-3">VALUE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {article.specifications.map((s, i) => (
                        <tr key={i}>
                          <th scope="row" className="px-4 py-3 font-normal text-white">{s.parameter}</th>
                          <td className="px-4 py-3">{s.sub_class}</td>
                          <td className="px-4 py-3 text-gold">{s.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {article.source_references.length > 0 && (
              <section id="references" className="space-y-4 border-t border-white/10 pt-8" aria-labelledby="refs-heading">
                <h2 id="refs-heading" className="font-mono text-xs uppercase tracking-widest text-gold">
                  VERIFIED INTEL REFERENCES
                </h2>
                <ol className="list-inside list-decimal space-y-2 font-mono text-xs text-gray-400">
                  {article.source_references.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </section>
            )}

            <div className="lg:hidden">
              <ShareLinks url={url} title={article.title} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
