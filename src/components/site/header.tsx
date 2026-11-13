"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { SearchDialog } from "./search-dialog";

export interface NavItem {
  label: string;
  href: string;
}

export function Header({ nav }: { nav: NavItem[] }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Close the mobile menu on navigation.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[120rem] items-center justify-between px-6 md:px-12">
          <Link href="/" className="group flex items-center gap-3" aria-label="StratScope home">
            <span className="font-serif text-xl font-bold tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-gold md:text-2xl">
              STRAT<span className="text-gold">SCOPE</span>
            </span>
            <span className="hidden rounded-sm border border-gold/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-gold sm:inline-block">
              INTEL CORE
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-4 font-mono text-[11px] uppercase tracking-widest text-gray-400 xl:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`whitespace-nowrap transition-colors hover:text-white ${isActive(item.href) ? "text-gold" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-400 transition-colors hover:text-gold"
              aria-label="Search Database"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-2 text-gray-400 hover:text-white xl:hidden"
              aria-label="Toggle Menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" aria-label="Mobile" className="max-h-[70vh] overflow-y-auto border-t border-white/10 bg-ink px-6 py-4 xl:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block border-b border-white/5 py-3 font-mono text-xs uppercase tracking-widest ${
                  isActive(item.href) ? "text-gold" : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div
          aria-hidden
          className="h-px origin-left bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-100"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </header>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
