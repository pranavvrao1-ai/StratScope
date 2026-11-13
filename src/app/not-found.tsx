import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not Found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center">
      <Link href="/" className="font-serif text-2xl font-bold tracking-[0.2em] text-white">
        STRAT<span className="text-gold">SCOPE</span>
      </Link>
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold">ERROR 404</span>
      <h1 className="font-serif text-3xl text-white md:text-5xl">REPORT NOT FOUND</h1>
      <p className="max-w-md font-sans text-sm text-gray-400">The page you requested does not exist or has been moved.</p>
      <Link href="/" className="font-mono text-xs uppercase tracking-widest text-gold hover:text-white">
        RETURN HOME →
      </Link>
    </div>
  );
}
