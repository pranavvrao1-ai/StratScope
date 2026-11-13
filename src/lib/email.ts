import "server-only";
import { siteUrl } from "@/lib/site";

// Transactional email via Resend's HTTP API (replaces Base44's Core.SendEmail
// integration). Optional: if RESEND_API_KEY / EMAIL_FROM are not set, emails
// are skipped and the calling feature still succeeds.

interface Message {
  to: string;
  subject: string;
  html: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function resend(path: string, payload: unknown): Promise<boolean> {
  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) console.error(`[email] Resend ${path} failed: ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error("[email] Resend request failed", e);
    return false;
  }
}

export async function sendEmail(msg: Message): Promise<boolean> {
  if (!isEmailConfigured()) return false;
  return resend("/emails", { from: process.env.EMAIL_FROM, ...msg });
}

/** Sends in batches of 100 (Resend batch API limit). */
export async function sendBatch(messages: Message[]): Promise<void> {
  if (!isEmailConfigured() || messages.length === 0) return;
  for (let i = 0; i < messages.length; i += 100) {
    await resend(
      "/emails/batch",
      messages.slice(i, i + 100).map((m) => ({ from: process.env.EMAIL_FROM, ...m })),
    );
  }
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function frame(inner: string, footer: string): string {
  return `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #010204; color: #D1D5DB; padding: 32px;">
    <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="color: #D4AF37; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;">StratScope</h1>
    </div>
    ${inner}
    ${footer}
  </div>`;
}

const unsubscribeLine = (token: string) =>
  !token
    ? ""
    : `<p style="color: #6B7280; font-size: 11px; margin-top: 16px;"><a href="${siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}" style="color: #6B7280;">Unsubscribe</a></p>`;

/** Copy preserved verbatim from the original welcome email. */
export function welcomeEmail(token: string): { subject: string; html: string } {
  return {
    subject: "Welcome to StratScope",
    html: frame(
      `<h2 style="color: #F9FAFB; font-size: 24px; margin-bottom: 16px;">Welcome to StratScope</h2>
      <p style="color: #9CA3AF; line-height: 1.6; margin-bottom: 16px;">Thank you for subscribing to our fortnightly defence technology newsletter.</p>
      <p style="color: #9CA3AF; line-height: 1.6; margin-bottom: 24px;">Every two weeks, you'll receive curated technical analysis covering naval platforms, aerospace systems, missile technology, and emerging defence innovations — researched and written for students, researchers, and defence enthusiasts.</p>
      <a href="${siteUrl()}" style="display: inline-block; background: #D4AF37; color: #010204; padding: 12px 32px; text-decoration: none; font-weight: 600; font-size: 14px;">Read Latest Articles →</a>`,
      `<p style="color: #6B7280; font-size: 12px; margin-top: 32px; border-top: 1px solid #1F2937; padding-top: 16px;">— Pranav V Rao, Founder &amp; Editor-in-Chief, StratScope</p>${unsubscribeLine(token)}`,
    ),
  };
}

/** Copy preserved verbatim from the original "new article" notification. */
export function newArticleEmail(
  article: { title: string; slug: string; excerpt: string },
  token: string,
): { subject: string; html: string } {
  const url = `${siteUrl()}/articles/${article.slug}`;
  return {
    subject: `New Article Published: ${article.title}`,
    html: frame(
      `<h2 style="color: #F9FAFB; font-size: 24px; margin-bottom: 16px;">New Article Published</h2>
      <h3 style="color: #F9FAFB; font-size: 20px; margin-bottom: 12px;">${escape(article.title)}</h3>
      <p style="color: #9CA3AF; line-height: 1.6; margin-bottom: 24px;">${escape(article.excerpt || "A new defence technology analysis has been published on StratScope.")}</p>
      <a href="${url}" style="display: inline-block; background: #D4AF37; color: #010204; padding: 12px 32px; text-decoration: none; font-weight: 600; font-size: 14px;">Read Article →</a>`,
      `<p style="color: #6B7280; font-size: 12px; margin-top: 32px;">You're receiving this because you subscribed to StratScope fortnightly articles.</p>${unsubscribeLine(token)}`,
    ),
  };
}

export function contactNotificationEmail(m: { name: string; email: string; message: string }) {
  return {
    subject: `StratScope contact: ${m.name}`,
    html: frame(
      `<p style="color:#F9FAFB"><strong>${escape(m.name)}</strong> &lt;${escape(m.email)}&gt;</p>
       <p style="color:#9CA3AF; white-space: pre-wrap; line-height: 1.6;">${escape(m.message)}</p>`,
      "",
    ),
  };
}
