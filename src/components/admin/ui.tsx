// Small shared admin primitives (square, hairline-bordered, mono labels — matching the public brand).

export const inputClass =
  "w-full border border-white/10 bg-abyss px-3 py-2 font-sans text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none";
export const labelClass = "mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-gray-500";
export const buttonPrimary =
  "bg-gold px-4 py-2 font-sans text-sm font-medium text-black transition-colors hover:bg-white disabled:opacity-50";
export const buttonGhost =
  "border border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-gray-300 transition-colors hover:border-gold hover:text-gold disabled:opacity-50";
export const buttonDanger =
  "border border-red-500/30 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50";

export function PageTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold">{eyebrow}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-white">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export const STATUS_STYLES: Record<string, string> = {
  published: "border-emerald-700/50 text-emerald-400 bg-emerald-950/30",
  scheduled: "border-blue-700/50 text-blue-400 bg-blue-950/30",
  draft: "border-yellow-700/50 text-yellow-500 bg-yellow-950/30",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`border px-2 py-1 font-mono text-[10px] uppercase ${STATUS_STYLES[status] ?? ""}`}>{status}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-white/5 bg-abyss/40 py-16 text-center font-mono text-xs text-gray-500">{children}</p>;
}
