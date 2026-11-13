#!/usr/bin/env node
// Record-by-record verification of the Base44 migration.
//
//   node scripts/verify-migration.mjs          -> verifies seed-data.json + migrated image files
//   node scripts/verify-migration.mjs --db     -> additionally verifies the live Supabase database
//                                                (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
//
// Exit code 1 on any mismatch.
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { legacyUuid, rewriteMediaInHtml, rewriteMediaUrl, MIGRATED_MEDIA_PREFIX } from "./lib/transform-base44.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const raw = read("migration/base44-export/articles.json");
const rawComments = read("migration/base44-export/comments.json");
const staticContent = read("migration/base44-export/recovered-static-content.json");
const seed = read("src/lib/content/seed-data.json");

let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${msg}`);
  if (!ok) failures++;
};
const sha = (s) => createHash("sha256").update(s ?? "").digest("hex").slice(0, 12);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function verifyArticle(r, m, label) {
  console.log(`\n[${label}] ${r.slug} (${r.id})`);
  check(!!m, "record present");
  if (!m) return;
  check(m.legacy_id === r.id, "legacy id preserved");
  for (const f of ["slug", "title", "excerpt", "category", "status", "seo_title", "seo_description", "published_date"]) {
    check((m[f] ?? null) === (r[f] ?? null), `${f} identical`);
  }
  check(m.author_name === r.author, "author identical");
  check(m.body === rewriteMediaInHtml(r.body), `body identical (sha ${sha(r.body)} → ${sha(m.body)})`);
  check(Boolean(m.featured) === Boolean(r.featured), "featured identical");
  check(same(m.tags, r.tags ?? []), `tags identical (${(r.tags ?? []).length})`);
  check(same(m.source_references, r.references ?? []), `references identical (${(r.references ?? []).length})`);
  check(
    same(
      m.specifications.map((s) => [s.parameter, s.sub_class, s.value]),
      (r.specifications ?? []).map((s) => [s.parameter, s.sub_class, s.value]),
    ),
    `specifications identical (${(r.specifications ?? []).length} rows)`,
  );
  check(m.hero_image === rewriteMediaUrl(r.hero_image), "hero image mapped");
  check(same(m.gallery_images, (r.gallery_images ?? []).map(rewriteMediaUrl)), "gallery mapped");
  check(Number(m.reading_time) === Math.round(Number(r.reading_time ?? 0)), "reading time identical");
}

console.log("== Seed data (src/lib/content/seed-data.json) ==");
check(seed.articles.length === raw.length, `article count ${seed.articles.length}/${raw.length}`);
for (const r of raw) verifyArticle(r, seed.articles.find((a) => a.legacy_id === r.id), "seed");

console.log("\n[seed] comments");
check(seed.comments.length === rawComments.length, `comment count ${seed.comments.length}/${rawComments.length}`);
for (const c of rawComments) {
  const m = seed.comments.find((x) => x.legacy_id === c.id);
  check(
    !!m && m.content === c.content && m.author_name === c.author_name && m.likes === (c.likes ?? 0) &&
      m.article_id === legacyUuid("article", c.article_id),
    `comment by "${c.author_name}" identical`,
  );
}

console.log("\n[seed] categories & authors");
check(seed.categories.length === staticContent.categories.length, `category count ${seed.categories.length}`);
for (const c of staticContent.categories) {
  const m = seed.categories.find((x) => x.slug === c.slug);
  check(
    !!m && m.name === c.name && m.description === c.description && m.coming_soon_title === c.comingSoonTitle &&
      m.coming_soon_description === c.comingSoonDesc && m.short_name === c.short && m.domain_code === c.domain,
    `category ${c.slug} identical`,
  );
}

console.log("\n== Media files ==");
const urls = new Set();
for (const a of seed.articles) {
  if (a.hero_image) urls.add(a.hero_image);
  a.gallery_images.forEach((u) => urls.add(u));
  for (const m of a.body.matchAll(/src="([^"]+)"/g)) urls.add(m[1]);
}
urls.add(MIGRATED_MEDIA_PREFIX + "febd0efb5_images2.jpg");
for (const u of urls) {
  if (!u.startsWith("/")) {
    check(false, `${u} is still an external URL`);
    continue;
  }
  check(existsSync(join(root, "public", u)), `${u} exists in public/`);
}
const leftovers = JSON.stringify(seed).match(/base44/gi);
check(!leftovers, "seed data contains no base44 URLs");

if (process.argv.includes("--db")) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("\n--db requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, key, { auth: { persistSession: false } });
  console.log("\n== Database ==");
  const { data: articles, error } = await db.from("articles").select("*").not("legacy_id", "is", null);
  check(!error, `query articles ${error ? error.message : ""}`);
  for (const r of raw) verifyArticle(r, articles?.find((a) => a.legacy_id === r.id), "db");
  const { data: comments } = await db.from("comments").select("*").not("legacy_id", "is", null);
  for (const c of rawComments) {
    const m = comments?.find((x) => x.legacy_id === c.id);
    check(!!m && m.content === c.content && m.author_name === c.author_name, `db comment by "${c.author_name}"`);
  }
  const { data: cats } = await db.from("categories").select("slug");
  for (const c of staticContent.categories) check(!!cats?.find((x) => x.slug === c.slug), `db category ${c.slug}`);
}

console.log(failures ? `\n✗ ${failures} check(s) failed` : "\n✓ All migration checks passed");
process.exit(failures ? 1 : 0);
