"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthorizationError, requireAdmin, requireEditor } from "@/lib/auth";
import { newArticleEmail, sendBatch } from "@/lib/email";
import { readingTime, sanitizeArticleHtml } from "@/lib/html";
import { serverClient } from "@/lib/supabase/server";
import {
  articleInputSchema,
  authorInputSchema,
  categoryInputSchema,
  firstError,
  type ArticleInput,
} from "@/lib/validation";

// Every action: (1) verifies the caller's role, (2) validates input with zod,
// (3) runs as the signed-in user so RLS is enforced again in Postgres.

export type AdminResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const uuid = z.uuid();

async function guard<T>(fn: () => Promise<AdminResult<T>>, admin = false): Promise<AdminResult<T>> {
  try {
    await (admin ? requireAdmin() : requireEditor());
    return await fn();
  } catch (e) {
    if (e instanceof AuthorizationError) return { ok: false, error: e.message };
    console.error("[admin]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

function refreshSite() {
  revalidatePath("/", "layout");
}

function dbError(error: { message: string; code?: string } | null): string | null {
  if (!error) return null;
  if (error.code === "23505") return "That slug is already in use.";
  if (error.code === "23503") return "This item is still referenced by other content.";
  return error.message;
}

async function notifySubscribers(article: { title: string; slug: string; excerpt: string }) {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("subscribers")
    .select("email, unsubscribe_token")
    .is("unsubscribed_at", null)
    .limit(5000);
  if (!data?.length) return;
  await sendBatch(
    data.map((s) => {
      const mail = newArticleEmail(article, s.unsubscribe_token);
      return { to: s.email, subject: mail.subject, html: mail.html };
    }),
  );
}

// ---------------------------------------------------------------- articles

export async function saveArticle(id: string | null, input: ArticleInput): Promise<AdminResult<{ id: string }>> {
  return guard(async () => {
    if (id !== null && !uuid.safeParse(id).success) return { ok: false, error: "Invalid article id" };
    const parsed = articleInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const a = parsed.data;
    const body = sanitizeArticleHtml(a.body);
    const today = new Date().toISOString().slice(0, 10);
    const row = {
      ...a,
      body,
      tags: [...new Set(a.tags)],
      reading_time: readingTime(body),
      published_date: a.status === "published" && !a.published_date ? today : a.published_date,
    };

    const supabase = await serverClient();
    let previousStatus: string | null = null;
    let savedId = id;

    if (id) {
      const { data: prev } = await supabase.from("articles").select("status").eq("id", id).maybeSingle();
      if (!prev) return { ok: false, error: "Article not found" };
      previousStatus = prev.status;
      const { error } = await supabase.from("articles").update(row).eq("id", id);
      const msg = dbError(error);
      if (msg) return { ok: false, error: msg };
    } else {
      const { data, error } = await supabase.from("articles").insert(row).select("id").single();
      const msg = dbError(error);
      if (msg || !data) return { ok: false, error: msg ?? "Insert failed" };
      savedId = data.id;
    }

    if (row.featured) {
      await supabase.from("articles").update({ featured: false }).eq("featured", true).neq("id", savedId!);
    }
    if (row.status === "published" && previousStatus !== "published") {
      await notifySubscribers(row);
    }
    refreshSite();
    return { ok: true, data: { id: savedId! } };
  });
}

export async function setArticleStatus(id: string, status: "draft" | "published"): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { data: prev } = await supabase.from("articles").select("status, published_date, title, slug, excerpt").eq("id", id).maybeSingle();
    if (!prev) return { ok: false, error: "Article not found" };
    const patch: Record<string, unknown> = { status };
    if (status === "published" && !prev.published_date) patch.published_date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("articles").update(patch).eq("id", id);
    if (error) return { ok: false, error: error.message };
    if (status === "published" && prev.status !== "published") await notifySubscribers(prev);
    refreshSite();
    return { ok: true };
  });
}

export async function toggleFeatured(id: string, featured: boolean): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    if (featured) await supabase.from("articles").update({ featured: false }).eq("featured", true).neq("id", id);
    const { error } = await supabase.from("articles").update({ featured }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refreshSite();
    return { ok: true };
  });
}

export async function deleteArticle(id: string): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    refreshSite();
    return { ok: true };
  });
}

// -------------------------------------------------------------- categories

export async function saveCategory(originalSlug: string | null, input: z.input<typeof categoryInputSchema>): Promise<AdminResult> {
  return guard(async () => {
    const parsed = categoryInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const supabase = await serverClient();
    const { error } = originalSlug
      ? await supabase.from("categories").update(parsed.data).eq("slug", originalSlug)
      : await supabase.from("categories").insert(parsed.data);
    const msg = dbError(error);
    if (msg) return { ok: false, error: msg };
    refreshSite();
    return { ok: true };
  });
}

export async function deleteCategory(slug: string): Promise<AdminResult> {
  return guard(async () => {
    const supabase = await serverClient();
    const { error } = await supabase.from("categories").delete().eq("slug", slug);
    const msg = dbError(error);
    if (msg) return { ok: false, error: error?.code === "23503" ? "Move or delete this category's articles first." : msg };
    refreshSite();
    return { ok: true };
  });
}

// ----------------------------------------------------------------- authors

export async function saveAuthor(id: string | null, input: z.input<typeof authorInputSchema>): Promise<AdminResult> {
  return guard(async () => {
    if (id && !uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const parsed = authorInputSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const supabase = await serverClient();
    const { error } = id
      ? await supabase.from("authors").update(parsed.data).eq("id", id)
      : await supabase.from("authors").insert(parsed.data);
    const msg = dbError(error);
    if (msg) return { ok: false, error: msg };
    refreshSite();
    return { ok: true };
  });
}

export async function deleteAuthor(id: string): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("authors").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    refreshSite();
    return { ok: true };
  });
}

// -------------------------------------------------------------------- tags

const tagSchema = z.string().trim().toLowerCase().min(1).max(60);

/** Renames (or, with `to === null`, removes) a tag across every article. */
export async function renameTag(from: string, to: string | null): Promise<AdminResult<{ updated: number }>> {
  return guard(async () => {
    const f = tagSchema.safeParse(from);
    const t = to === null ? null : tagSchema.safeParse(to);
    if (!f.success || (t && !t.success)) return { ok: false, error: "Invalid tag" };
    const supabase = await serverClient();
    const { data, error } = await supabase.from("articles").select("id, tags").contains("tags", [f.data]);
    if (error) return { ok: false, error: error.message };
    for (const row of data ?? []) {
      const tags = (row.tags as string[]).flatMap((x) => (x === f.data ? (t?.success ? [t.data] : []) : [x]));
      const { error: e } = await supabase.from("articles").update({ tags: [...new Set(tags)] }).eq("id", row.id);
      if (e) return { ok: false, error: e.message };
    }
    refreshSite();
    return { ok: true, data: { updated: data?.length ?? 0 } };
  });
}

// ---------------------------------------------------------------- comments

export async function setCommentHidden(id: string, hidden: boolean): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("comments").update({ is_hidden: hidden }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    refreshSite();
    return { ok: true };
  });
}

export async function deleteComment(id: string): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    refreshSite();
    return { ok: true };
  });
}

// ---------------------------------------------------- subscribers / inbox

export async function deleteSubscriber(id: string): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });
}

export async function setMessageHandled(id: string, handled: boolean): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("contact_messages").update({ handled }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });
}

export async function deleteMessage(id: string): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid id" };
    const supabase = await serverClient();
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  });
}

// -------------------------------------------------------------------- team

export async function setUserRole(userId: string, role: "none" | "editor" | "admin"): Promise<AdminResult> {
  return guard(async () => {
    if (!uuid.safeParse(userId).success) return { ok: false, error: "Invalid id" };
    if (!["none", "editor", "admin"].includes(role)) return { ok: false, error: "Invalid role" };
    const me = await requireAdmin();
    if (me.id === userId && role !== "admin") return { ok: false, error: "You cannot remove your own administrator role." };
    const supabase = await serverClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
    return error ? { ok: false, error: error.message } : { ok: true };
  }, true);
}
