import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { transformAll } from "../scripts/lib/transform-base44.mjs";
import seed from "@/lib/content/seed-data.json";

const root = join(__dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));
const raw = read("migration/base44-export/articles.json");
const rawComments = read("migration/base44-export/comments.json");
const staticContent = read("migration/base44-export/recovered-static-content.json");

describe("Base44 migration", () => {
  it("committed seed data is exactly the transform of the raw export", () => {
    expect(transformAll({ articles: raw, comments: rawComments, staticContent })).toEqual(seed);
  });

  it("accounts for every exported article and comment", () => {
    expect(seed.articles.map((a) => a.legacy_id).sort()).toEqual(raw.map((a: { id: string }) => a.id).sort());
    expect(seed.comments.map((c) => c.legacy_id).sort()).toEqual(rawComments.map((c: { id: string }) => c.id).sort());
  });

  it("preserves article text verbatim", () => {
    for (const r of raw) {
      const m = seed.articles.find((a) => a.legacy_id === r.id)!;
      expect(m.title).toBe(r.title);
      expect(m.excerpt).toBe(r.excerpt);
      expect(m.body).toBe(r.body); // no embedded Base44 media in bodies, so bodies are byte-identical
      expect(m.source_references).toEqual(r.references);
      expect(m.tags).toEqual(r.tags);
      expect(m.published_date).toBe(r.published_date);
      expect(m.author_name).toBe(r.author);
    }
  });

  it("has every referenced image on disk and no Base44 URLs", () => {
    const json = JSON.stringify(seed);
    expect(json).not.toMatch(/base44/i);
    for (const a of seed.articles) {
      for (const src of [a.hero_image, ...a.gallery_images].filter(Boolean)) {
        expect(existsSync(join(root, "public", src)), src).toBe(true);
      }
    }
  });

  it("seed.sql contains every record", () => {
    const sql = readFileSync(join(root, "supabase/seed.sql"), "utf8");
    for (const a of seed.articles) expect(sql).toContain(a.legacy_id!);
    for (const c of seed.comments) expect(sql).toContain(c.legacy_id);
    for (const c of seed.categories) expect(sql).toContain(`$ss$${c.slug}$ss$`);
  });
});
