import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { isGoogleAuthEnabled, isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

const MESSAGES: Record<string, string> = {
  forbidden: "Your account does not have editorial access. Ask an administrator to grant you the editor role.",
  unconfigured: "The admin panel needs Supabase to be configured. See docs/deployment-guide.md.",
  link: "That sign-in link is invalid or has expired. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, next, reset } = await searchParams;
  const message = typeof error === "string" ? MESSAGES[error] : undefined;
  const safeNext = typeof next === "string" && next.startsWith("/admin") ? next : "/admin";
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-[0.2em] text-white">
            STRAT<span className="text-gold">SCOPE</span>
          </h1>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-gray-500">Secure Control Panel</p>
        </div>
        <div className="border border-white/10 bg-abyss p-8">
          {message && <p className="mb-6 border border-red-500/30 bg-red-950/30 p-3 font-sans text-sm text-red-300">{message}</p>}
          {reset === "sent" && (
            <p className="mb-6 border border-gold/30 bg-gold/10 p-3 font-sans text-sm text-gold">
              If that address has an account, a password reset link is on its way.
            </p>
          )}
          {reset === "done" && (
            <p className="mb-6 border border-gold/30 bg-gold/10 p-3 font-sans text-sm text-gold">Password updated. Sign in with your new password.</p>
          )}
          <LoginForm next={safeNext} configured={isSupabaseConfigured()} google={isGoogleAuthEnabled()} />
        </div>
      </div>
    </div>
  );
}
