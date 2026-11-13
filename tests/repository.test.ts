import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.CONTENT_SOURCE = "seed";
});

describe("content repository (seed mode)", () => {
  it("lists the published article", async () => {
    const { getPublishedArticles } = await import("@/lib/content/repository");
    const list = await getPublishedArticles(100);
    expect(list.map((a) => a.slug)).toEqual(["brahmos-the-game-changer"]);
    expect(list[0]).not.toHaveProperty("body"); // summaries stay small
  });

  it("finds an article by slug and returns null for unknown slugs", async () => {
    const { getArticleBySlug } = await import("@/lib/content/repository");
    expect((await getArticleBySlug("brahmos-the-game-changer"))?.title).toBe("BrahMos: The Game Changer");
    expect(await getArticleBySlug("does-not-exist")).toBeNull();
  });

  it("returns the four original categories in order", async () => {
    const { getCategories } = await import("@/lib/content/repository");
    expect((await getCategories()).map((c) => c.slug)).toEqual(["naval-technology", "air-power", "land-systems", "missile-technology"]);
  });

  it("returns migrated comments newest first", async () => {
    const { getArticleBySlug, getComments } = await import("@/lib/content/repository");
    const article = await getArticleBySlug("brahmos-the-game-changer");
    const comments = await getComments(article!.id);
    expect(comments.map((c) => c.author_name)).toEqual(["Sudhanva", "ABC"]);
  });

  it("derives trending tags from published articles", async () => {
    const { getTrendingTags } = await import("@/lib/content/repository");
    expect(await getTrendingTags()).toContain("brahmos");
  });
});
