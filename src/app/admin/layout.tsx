import type { Metadata } from "next";
import Link from "next/link";
import { requireEditorPage } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Control Panel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireEditorPage();
  return (
    <div className="min-h-screen bg-ink text-snow">
      <header className="border-b border-white/10 bg-abyss">
        <div className="mx-auto flex max-w-[120rem] flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-12">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold">AUTHENTICATED CONSOLE</p>
            <p className="font-serif text-lg font-bold tracking-wider text-white">STRATSCOPE SECURE CONTROL PANEL</p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-gray-400">
            <span className="hidden sm:inline">
              {profile.email} · <span className="uppercase text-gold">{profile.role}</span>
            </span>
            <Link href="/" className="hover:text-white" target="_blank">
              VIEW SITE ↗
            </Link>
            <form action={signOut}>
              <button type="submit" className="border border-white/10 px-3 py-1.5 hover:border-gold hover:text-gold">
                SIGN OUT
              </button>
            </form>
          </div>
        </div>
        <AdminNav isAdmin={profile.role === "admin"} />
      </header>
      <main className="mx-auto max-w-[120rem] px-6 py-10 md:px-12">{children}</main>
    </div>
  );
}
