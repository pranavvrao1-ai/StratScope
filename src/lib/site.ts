// Site-wide configuration. Copy preserved verbatim from the original StratScope site.

export const SITE = {
  name: "StratScope",
  title: "StratScope — Defence Technology Intelligence",
  description:
    "StratScope — An independent defence technology publication and knowledge base. Documenting military technology, naval systems, aerospace, missile technology, space systems, cybersecurity, and AI in defence using publicly available information.",
  socialDescription:
    "An independent educational defence technology publication dedicated to documenting and explaining existing military technologies using publicly available information.",
  keywords: [
    "defence technology",
    "military technology",
    "missile technology",
    "naval systems",
    "aerospace",
    "cybersecurity",
    "AI defence",
    "strategic analysis",
    "country profiles",
  ],
  founder: "Pranav V Rao",
  contactEmail: "pranavvrao1@gmail.com",
  logoPath: "/images/migrated/fe95762a2_logo.jpg",
  homeHeroImage: "/images/migrated/febd0efb5_images2.jpg",
} as const;

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** "Coming Next" editorial banner shown on the home page and the Naval Technology category. */
export const COMING_NEXT = {
  categoryLabel: "Naval Technology",
  categorySlug: "naval-technology",
  title: "Varunastra — India's Heavyweight Torpedo",
  description:
    "An in-depth analysis of the Varunastra, India's indigenously developed ship-launched heavyweight torpedo — covering its design, propulsion, guidance systems, and operational role in naval warfare.",
} as const;

export const NEWSLETTER_DISMISSED_KEY = "stratscope_email_prompt_dismissed";
export const LIKED_COMMENTS_KEY = "stratscope_liked_comments";
