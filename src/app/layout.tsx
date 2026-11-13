import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { SITE, siteUrl } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE.title, template: "%s — StratScope" },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.founder }],
  creator: SITE.founder,
  publisher: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.socialDescription,
    url: "/",
    images: [{ url: SITE.homeHeroImage, width: 739, height: 415, alt: "Missile launch at sea" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.socialDescription,
    images: [SITE.homeHeroImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#080B11",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen bg-ink text-snow antialiased">{children}</body>
    </html>
  );
}
