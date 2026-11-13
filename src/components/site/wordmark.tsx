export function Wordmark({ className = "text-xl md:text-2xl" }: { className?: string }) {
  return (
    <span className={`font-serif tracking-[0.2em] font-bold text-white ${className}`}>
      STRAT<span className="text-gold">SCOPE</span>
    </span>
  );
}
