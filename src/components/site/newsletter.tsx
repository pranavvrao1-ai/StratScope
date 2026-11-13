"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Mail, X } from "lucide-react";
import { subscribe } from "@/app/actions/public";
import { NEWSLETTER_DISMISSED_KEY } from "@/lib/site";

function remember() {
  try {
    localStorage.setItem(NEWSLETTER_DISMISSED_KEY, "true");
  } catch {}
}

function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="absolute -left-[9999px] h-0 w-0 opacity-0"
    />
  );
}

/** Bottom-right prompt shown after 4 s, as on the original site. */
export function NewsletterPrompt() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = Boolean(localStorage.getItem(NEWSLETTER_DISMISSED_KEY));
    } catch {}
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    remember();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    start(async () => {
      const res = await subscribe({ email, website: trap });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      remember();
      setTimeout(() => setVisible(false), 3000);
    });
  };

  return (
    <div className="animate-slide-up fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] max-w-md" role="dialog" aria-label="Newsletter subscription">
      <div className="relative border border-gold/30 bg-abyss shadow-2xl">
        <button type="button" onClick={dismiss} className="absolute right-3 top-3 text-gray-500 transition-colors hover:text-white" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
        <div className="absolute left-0 top-0 h-full w-1 bg-gold" />
        <div className="p-6 pl-8">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                <Check className="h-5 w-5 text-gold" />
              </div>
              <p className="text-center font-sans text-sm text-gold">Thank you for subscribing!</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-gold">Stay Informed</span>
              </div>
              <h3 className="mb-2 font-serif text-xl font-bold leading-tight text-white">Subscribe to Fortnightly Articles</h3>
              <p className="mb-4 font-sans text-sm leading-relaxed text-gray-400">
                Receive curated defence technology analysis every two weeks. Optional — skip if you prefer.
              </p>
              <form onSubmit={submit} className="relative flex flex-col gap-3 sm:flex-row">
                <Honeypot value={trap} onChange={setTrap} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="Email address"
                  className="flex-grow border border-white/10 bg-ink px-4 py-3 font-sans text-sm text-white placeholder-gray-600 transition-colors focus:border-gold focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="whitespace-nowrap bg-gold px-6 py-3 font-sans text-sm font-medium text-black transition-colors hover:bg-white disabled:opacity-50"
                >
                  {pending ? "..." : "Subscribe"}
                </button>
              </form>
              {error && <p className="mt-3 font-sans text-xs text-red-400">{error}</p>}
              <button type="button" onClick={dismiss} className="mt-3 font-sans text-xs text-gray-500 transition-colors hover:text-gray-300">
                No thanks, maybe later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Subscribe to the StratScope Newsletter" section at the bottom of the home page. */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    start(async () => {
      const res = await subscribe({ email, website: trap });
      if (res.ok) {
        setDone(true);
        remember();
      } else setError(res.error);
    });
  };

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-abyss py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative z-10 mx-auto max-w-[120rem] px-6 md:px-12">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Stay informed</span>
          <h2 className="font-serif text-3xl font-bold text-white md:text-5xl">Subscribe to the StratScope Newsletter</h2>
          <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-gray-400 md:text-base">
            Receive periodic technical analysis and defence technology updates delivered to your inbox. No spam, no advertising — just
            well-researched content.
          </p>
          {done ? (
            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
                <Check className="h-6 w-6 text-gold" />
              </div>
              <p className="font-sans text-sm text-gold">Thank you for subscribing!</p>
            </div>
          ) : (
            <form onSubmit={submit} className="relative mx-auto flex max-w-lg flex-col gap-4 pt-4 sm:flex-row">
              <Honeypot value={trap} onChange={setTrap} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Email address"
                className="flex-grow border border-white/10 bg-ink px-5 py-4 font-sans text-sm text-white placeholder-gray-600 transition-colors focus:border-gold focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="bg-gold px-8 py-4 font-sans text-sm font-medium tracking-wide text-black transition-colors hover:bg-white disabled:opacity-50"
              >
                {pending ? "..." : "Subscribe"}
              </button>
            </form>
          )}
          {error && <p className="font-sans text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </section>
  );
}
