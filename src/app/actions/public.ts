"use server";

import { revalidatePath } from "next/cache";
import { contentSource } from "@/lib/env";
import { publicClient } from "@/lib/supabase/public";
import { commentSchema, contactSchema, firstError, subscribeSchema } from "@/lib/validation";
import { contactNotificationEmail, sendEmail, welcomeEmail } from "@/lib/email";
import { SITE } from "@/lib/site";
import type { Comment } from "@/lib/content/types";

// Public mutations. Server Actions are POST-only and origin-checked by Next.js
// (CSRF protection). All writes go through the anon role, so database RLS and
// column grants are the final authority.

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const READ_ONLY: ActionResult<never> = {
  ok: false,
  error: "This preview is running from bundled seed content and cannot accept submissions.",
};

export async function subscribe(input: { email: string; website?: string }): Promise<ActionResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please enter a valid email address." };
  if (parsed.data.website) return { ok: true }; // honeypot: silently accept bots
  if (contentSource() === "seed") return READ_ONLY;

  const { error } = await publicClient().from("subscribers").insert({ email: parsed.data.email });
  if (error && error.code !== "23505") {
    console.error("[subscribe]", error.message);
    return { ok: false, error: "Subscription failed. Please try again." };
  }
  if (!error) {
    // The unsubscribe token is not readable by the anon role, so the welcome
    // mail carries no unsubscribe link; every newsletter mail does.
    const mail = welcomeEmail("");
    await sendEmail({ to: parsed.data.email, subject: mail.subject, html: mail.html });
  }
  return { ok: true };
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  message: string;
  website?: string;
}): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (parsed.data.website) return { ok: true };
  if (contentSource() === "seed") return READ_ONLY;

  const { name, email, message } = parsed.data;
  const { error } = await publicClient().from("contact_messages").insert({ name, email, message });
  if (error) {
    console.error("[contact]", error.message);
    return { ok: false, error: "Your message could not be sent. Please email us directly." };
  }
  const notify = contactNotificationEmail({ name, email, message });
  await sendEmail({ to: process.env.CONTACT_INBOX || SITE.contactEmail, ...notify });
  return { ok: true };
}

export async function postComment(input: {
  article_id: string;
  author_name: string;
  content: string;
  website?: string;
}): Promise<ActionResult<Comment>> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  if (parsed.data.website) return { ok: false, error: "Failed to post your comment. Please try again." };
  if (contentSource() === "seed") return READ_ONLY;

  const { article_id, author_name, content } = parsed.data;
  const { data, error } = await publicClient()
    .from("comments")
    .insert({ article_id, author_name, content })
    .select("id, article_id, author_name, content, likes, created_at")
    .single();
  if (error || !data) {
    console.error("[comment]", error?.message);
    return { ok: false, error: "Failed to post your comment. Please try again." };
  }
  const { data: article } = await publicClient().from("articles").select("slug").eq("id", article_id).maybeSingle();
  if (article?.slug) revalidatePath(`/articles/${article.slug}`);
  return { ok: true, data: data as Comment };
}

export async function likeComment(commentId: string): Promise<ActionResult<number>> {
  if (!/^[0-9a-f-]{36}$/i.test(commentId)) return { ok: false, error: "Invalid comment" };
  if (contentSource() === "seed") return READ_ONLY;
  const { data, error } = await publicClient().rpc("like_comment", { comment_id: commentId });
  if (error) return { ok: false, error: "Could not register like" };
  return { ok: true, data: data as number };
}
