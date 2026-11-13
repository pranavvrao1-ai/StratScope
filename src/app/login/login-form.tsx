"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, signIn } from "@/app/actions/auth";
import { browserClient } from "@/lib/supabase/browser";

const field =
  "w-full border border-white/10 bg-ink px-4 py-3 font-sans text-sm text-white placeholder-gray-600 focus:border-gold focus:outline-none";
const label = "mb-2 block font-mono text-xs uppercase tracking-widest text-gray-500";

export function LoginForm({ next, configured, google }: { next: string; configured: boolean; google: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (!configured) return <p className="font-sans text-sm text-gray-400">Sign-in is unavailable in seed/preview mode.</p>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      if (mode === "reset") {
        await requestPasswordReset(email);
        router.push("/login?reset=sent");
        setMode("signin");
        return;
      }
      const res = await signIn(email, password);
      if (!res.ok) setError(res.error);
      else {
        router.replace(next);
        router.refresh();
      }
    });
  };

  const googleSignIn = async () => {
    const supabase = browserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="email" className={label}>
            Email
          </label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
        </div>
        {mode === "signin" && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={label}>
                Password
              </label>
              <button type="button" onClick={() => setMode("reset")} className="mb-2 font-mono text-[10px] uppercase tracking-widest text-gray-500 hover:text-gold">
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={field}
            />
          </div>
        )}
        {error && <p className="font-sans text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-gold py-3 font-sans text-sm font-medium tracking-wide text-black transition-colors hover:bg-white disabled:opacity-50"
        >
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Send reset link"}
        </button>
        {mode === "reset" && (
          <button type="button" onClick={() => setMode("signin")} className="w-full font-sans text-xs text-gray-500 hover:text-white">
            Back to sign in
          </button>
        )}
      </form>
      {google && mode === "signin" && (
        <>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase text-gray-600">
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </div>
          <button type="button" onClick={googleSignIn} className="w-full border border-white/20 py-3 font-sans text-sm text-white hover:border-gold">
            Continue with Google
          </button>
        </>
      )}
      <p className="font-sans text-xs leading-relaxed text-gray-600">Editorial accounts are created by invitation. Contact the administrator for access.</p>
    </div>
  );
}
