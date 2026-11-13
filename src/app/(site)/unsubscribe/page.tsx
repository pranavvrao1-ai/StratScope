import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

const TOKEN = /^[0-9a-f-]{36}$/i;

// A confirmation button (POST) instead of unsubscribing on GET, so email
// link scanners cannot unsubscribe readers.
async function confirmUnsubscribe(formData: FormData) {
  "use server";
  const token = String(formData.get("token") ?? "");
  let ok = false;
  if (TOKEN.test(token) && isSupabaseConfigured()) {
    const { data } = await publicClient().rpc("unsubscribe", { token });
    ok = data === true;
  }
  redirect(`/unsubscribe?status=${ok ? "done" : "invalid"}`);
}

export default async function UnsubscribePage({ searchParams }: PageProps<"/unsubscribe">) {
  const { token, status } = await searchParams;
  const validToken = typeof token === "string" && TOKEN.test(token);

  let heading = "Unsubscribe from StratScope";
  let text = "Confirm that you no longer want to receive StratScope article emails.";
  if (status === "done") {
    heading = "You have been unsubscribed";
    text = "You will no longer receive StratScope article emails.";
  } else if (status === "invalid" || !validToken) {
    heading = "Link not recognised";
    text = "This unsubscribe link is invalid or has already been used. Contact us if you keep receiving emails.";
  }

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-24">
      <div className="max-w-lg space-y-6 text-center">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-gold">Newsletter</span>
        <h1 className="font-serif text-3xl font-bold text-white md:text-4xl">{heading}</h1>
        <p className="font-sans text-sm text-gray-400">{text}</p>
        {!status && validToken && (
          <form action={confirmUnsubscribe}>
            <input type="hidden" name="token" value={token} />
            <button type="submit" className="bg-gold px-8 py-4 font-sans text-sm font-medium text-black transition-colors hover:bg-white">
              Unsubscribe
            </button>
          </form>
        )}
        <Link href="/" className="inline-block font-mono text-xs uppercase tracking-widest text-gold hover:text-white">
          RETURN HOME →
        </Link>
      </div>
    </section>
  );
}
