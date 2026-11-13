import Link from "next/link";
import type { Category } from "@/lib/content/types";

export function Footer({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-abyss py-16 font-mono text-xs text-gray-400 md:py-24">
      <div className="mx-auto grid max-w-[120rem] grid-cols-1 gap-12 px-6 md:grid-cols-2 md:px-12 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <span className="font-serif text-2xl font-bold tracking-[0.2em] text-white">
            STRAT<span className="text-gold">SCOPE</span>
          </span>
          <p className="font-sans text-xs leading-relaxed text-gray-500">
            An independent strategic intelligence and defense technology publication. Formulating clear architectural analysis of
            global defense capabilities through open-source collection.
          </p>
          <p className="text-[10px] tracking-wider text-gray-600">© {year} STRATSCOPE. ALL RIGHTS RESERVED.</p>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <span className="block border-b border-white/5 pb-2 text-[10px] font-bold uppercase tracking-widest text-white">
            TACTICAL DOMAINS
          </span>
          <ul className="space-y-2 text-gray-500">
            {categories.slice(0, 4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="transition-colors hover:text-white">
                  {c.name.toUpperCase()}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <span className="block border-b border-white/5 pb-2 text-[10px] font-bold uppercase tracking-widest text-white">RESOURCES</span>
          <ul className="space-y-2 text-gray-500">
            {categories.slice(4).map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="transition-colors hover:text-white">
                  {c.name.toUpperCase()}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/about" className="transition-colors hover:text-white">
                ABOUT
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-white">
                CONTACT
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-[10px] text-gray-600 lg:col-span-2">
          <span className="block border-b border-white/5 pb-2 font-bold uppercase tracking-widest text-white">SYSTEM STATUS</span>
          <div className="space-y-1">
            <p>SSL: SECURED</p>
            <p>INTEGRITY: VERIFIED</p>
            <p>COMPLIANCE: OSINT</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
