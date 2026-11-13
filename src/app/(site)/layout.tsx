import { Footer } from "@/components/site/footer";
import { Header, type NavItem } from "@/components/site/header";
import { NewsletterPrompt } from "@/components/site/newsletter";
import { getCategories } from "@/lib/content/repository";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const nav: NavItem[] = [
    { label: "Home", href: "/" },
    ...categories.map((c) => ({ label: c.short_name, href: `/category/${c.slug}` })),
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-ink text-snow">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:bg-gold focus:px-4 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <Header nav={nav} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer categories={categories} />
      <NewsletterPrompt />
    </div>
  );
}
