"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Articles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/authors", label: "Authors" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, { href: "/admin/team", label: "Team" }] : ITEMS;
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/articles") : pathname.startsWith(href));
  return (
    <nav aria-label="Admin" className="mx-auto flex max-w-[120rem] gap-6 overflow-x-auto px-6 md:px-12">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i.href) ? "page" : undefined}
          className={`whitespace-nowrap border-b-2 py-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
            active(i.href) ? "border-gold text-gold" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
