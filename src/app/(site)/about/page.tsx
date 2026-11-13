import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "StratScope is an independent educational defence technology publication dedicated to documenting and explaining existing military technologies using publicly available information.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="bg-ink">
      <section className="border-b border-white/10 py-24 md:py-36">
        <div className="mx-auto max-w-[120rem] px-6 md:px-12">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <span className="font-mono text-xs tracking-[0.3em] text-gold">FOUNDATIONAL STATEMENT</span>
              <h1 className="font-serif text-4xl font-bold text-white md:text-6xl">ABOUT STRATSCOPE</h1>
              <div className="h-px w-full bg-gradient-to-r from-gold to-transparent" />
            </div>
            <div className="space-y-8 font-sans text-lg leading-relaxed text-gray-300 lg:col-span-7">
              <blockquote className="border-l-4 border-gold pl-6 text-xl italic text-white">
                &ldquo;StratScope is an independent educational defence technology publication dedicated to documenting and explaining
                existing military technologies using publicly available information.&rdquo;
              </blockquote>
              <p>
                Founded and maintained by <strong className="font-semibold text-white">Pranav V Rao</strong>, StratScope is a personal project
                created to build a reliable knowledge base for students, researchers, and defence enthusiasts.
              </p>
              <p className="font-mono text-sm uppercase tracking-wider text-gray-500">
                StratScope is not affiliated with any government, military organization, or defence company.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
