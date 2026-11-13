import Link from "next/link";
import type { ArticleSummary, Category } from "@/lib/content/types";
import { COMING_NEXT } from "@/lib/site";
import { MediaImage } from "./media-image";

export function ArticleCard({ article, category, priority = false }: { article: ArticleSummary; category?: Category; priority?: boolean }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group relative flex flex-col justify-between overflow-hidden border border-white/10 bg-abyss/40 p-6 transition-all duration-500 hover:border-gold/50 md:p-8"
    >
      <div className="absolute left-0 top-0 h-[2px] w-full origin-left scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
      <div className="space-y-6">
        <div className="relative aspect-video w-full overflow-hidden border border-white/5 bg-ink">
          {article.hero_image ? (
            <MediaImage
              src={article.hero_image}
              alt={article.hero_image_alt || article.title}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-xs text-gray-600">No image</div>
          )}
        </div>
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-gold">{(category?.name || article.category).toUpperCase()}</span>
          <h3 className="line-clamp-2 font-serif text-2xl font-bold text-white transition-colors group-hover:text-gold">{article.title}</h3>
          {article.excerpt && <p className="line-clamp-3 font-sans text-sm leading-relaxed text-gray-400">{article.excerpt}</p>}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6 font-sans text-xs">
        <span className="text-gray-500">{article.reading_time || 0} min read</span>
        <span className="flex items-center gap-2 text-white transition-colors group-hover:text-gold">
          Read Article <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  );
}

export function ComingSoonCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative flex flex-col justify-between border border-white/5 bg-abyss/20 p-6 opacity-75 transition-all duration-300 hover:border-white/10 hover:opacity-100 md:p-8"
    >
      <div className="space-y-6">
        <div className="relative flex aspect-video w-full items-center justify-center border border-white/5 bg-ink">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px]" />
          <span className="relative z-10 font-mono text-[10px] uppercase tracking-widest text-gray-500">Coming Soon</span>
        </div>
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-gray-500">{category.name.toUpperCase()}</span>
          <h3 className="font-serif text-2xl font-bold text-gray-400">{category.coming_soon_title}</h3>
          <p className="font-sans text-sm leading-relaxed text-gray-500">{category.coming_soon_description}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6 font-sans text-xs">
        <span className="text-gray-600">In preparation</span>
        <span className="flex items-center gap-2 text-gray-500 transition-colors group-hover:text-gold">
          Learn more <span>→</span>
        </span>
      </div>
    </Link>
  );
}

export function ComingNextBanner() {
  return (
    <div className="relative overflow-hidden border border-gold/20 bg-gradient-to-r from-abyss via-ink to-abyss p-8 md:p-12">
      <div className="absolute left-0 top-0 h-full w-1 bg-gold" />
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
        <div className="flex-shrink-0">
          <span className="inline-block border border-gold/30 bg-gold/10 px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
            Coming Next
          </span>
        </div>
        <div className="flex-grow">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500">{COMING_NEXT.categoryLabel}</span>
          <h3 className="mt-2 font-serif text-2xl font-bold text-white md:text-4xl">{COMING_NEXT.title}</h3>
          <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-gray-400">{COMING_NEXT.description}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-start gap-2 md:items-end">
          <span className="font-mono text-xs uppercase tracking-widest text-gray-600">In Preparation</span>
          <span className="font-mono text-sm text-gold">Article Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-gold" />
    </div>
  );
}
