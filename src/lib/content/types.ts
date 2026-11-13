export type ArticleStatus = "draft" | "published" | "scheduled";

export interface Specification {
  parameter: string;
  sub_class: string;
  value: string;
}

export interface Article {
  id: string;
  legacy_id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  author_id: string | null;
  author_name: string;
  status: ArticleStatus;
  featured: boolean;
  hero_image: string;
  hero_image_alt: string;
  hero_image_credit: string;
  gallery_images: string[];
  specifications: Specification[];
  source_references: string[];
  tags: string[];
  seo_title: string;
  seo_description: string;
  reading_time: number;
  published_date: string | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields needed for cards, lists and search. */
export type ArticleSummary = Pick<
  Article,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "category"
  | "hero_image"
  | "hero_image_alt"
  | "reading_time"
  | "published_date"
  | "updated_at"
  | "featured"
  | "tags"
>;

export interface Category {
  slug: string;
  name: string;
  short_name: string;
  domain_code: string;
  description: string;
  coming_soon_title: string;
  coming_soon_description: string;
  sort_order: number;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  initials: string | null;
  bio: string | null;
}

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  content: string;
  likes: number;
  created_at: string;
}
