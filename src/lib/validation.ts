import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const trimmed = (max: number) => z.string().trim().max(max);

const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || v.startsWith("/") || /^https:\/\//i.test(v), "Must be an https:// URL or a site path");

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(320));

export const subscribeSchema = z.object({
  email: emailSchema,
  website: z.string().max(0).optional(), // honeypot
});

export const contactSchema = z.object({
  name: trimmed(120).min(1, "Please enter your name."),
  email: emailSchema,
  message: trimmed(5000).min(1, "Please enter a message."),
  website: z.string().max(0).optional(),
});

export const commentSchema = z.object({
  article_id: z.uuid(),
  author_name: trimmed(80).min(1, "Please enter your name and a comment."),
  content: trimmed(4000).min(1, "Please enter your name and a comment."),
  website: z.string().max(0).optional(),
});

export const specificationSchema = z.object({
  parameter: trimmed(200),
  sub_class: trimmed(200),
  value: trimmed(500),
});

export const articleInputSchema = z
  .object({
    title: trimmed(300).min(1, "Title is required"),
    slug: z.string().trim().min(1, "Slug is required").max(120).regex(SLUG_PATTERN, "Slug may contain lowercase letters, numbers and hyphens only"),
    excerpt: trimmed(1000),
    body: z.string().max(500_000),
    category: z.string().trim().regex(SLUG_PATTERN, "Choose a category"),
    author_id: z.uuid().nullable(),
    author_name: trimmed(120),
    status: z.enum(["draft", "published", "scheduled"]),
    featured: z.boolean(),
    hero_image: safeUrl,
    hero_image_alt: trimmed(300),
    hero_image_credit: trimmed(300),
    gallery_images: z.array(safeUrl.refine((v) => v !== "", "Empty image URL")).max(40),
    specifications: z.array(specificationSchema).max(100),
    source_references: z.array(trimmed(1000).min(1)).max(200),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(60)).max(40),
    seo_title: trimmed(300),
    seo_description: trimmed(500),
    published_date: z.iso.date().nullable(),
    scheduled_date: z.iso.datetime({ offset: true }).nullable(),
  })
  .refine((a) => a.status !== "scheduled" || a.scheduled_date, {
    message: "Scheduled articles need a scheduled date",
    path: ["scheduled_date"],
  });

export type ArticleInput = z.infer<typeof articleInputSchema>;

export const categoryInputSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(SLUG_PATTERN, "Invalid slug"),
  name: trimmed(120).min(1),
  short_name: trimmed(40).min(1),
  domain_code: trimmed(8),
  description: trimmed(500),
  coming_soon_title: trimmed(300),
  coming_soon_description: trimmed(1000),
  sort_order: z.coerce.number().int().min(0).max(1000),
});

export const authorInputSchema = z.object({
  slug: z.string().trim().min(1).max(80).regex(SLUG_PATTERN, "Invalid slug"),
  name: trimmed(120).min(1),
  title: trimmed(200),
  initials: trimmed(6),
  bio: trimmed(4000),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
