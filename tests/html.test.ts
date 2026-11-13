import { describe, expect, it } from "vitest";
import { prepareArticleBody, readingTime, sanitizeArticleHtml, stripTags } from "@/lib/html";
import seed from "@/lib/content/seed-data.json";

describe("sanitizeArticleHtml", () => {
  it("removes scripts, event handlers and javascript: URLs", () => {
    const dirty =
      '<p onclick="alert(1)">Hi<script>alert(1)</script></p><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">x</a><iframe src="https://evil"></iframe>';
    const clean = sanitizeArticleHtml(dirty);
    expect(clean).not.toMatch(/script|onclick|onerror|javascript:|iframe/i);
    expect(clean).toContain("<p>Hi</p>");
  });

  it("keeps editorial markup and text alignment only", () => {
    const html = '<h2 style="color:red; text-align: center">T</h2><blockquote><p><strong>a</strong> <em>b</em></p></blockquote>';
    const clean = sanitizeArticleHtml(html);
    expect(clean).toContain('<h2 style="text-align:center">T</h2>');
    expect(clean).not.toContain("color");
    expect(clean).toContain("<blockquote><p><strong>a</strong> <em>b</em></p></blockquote>");
  });

  it("opens external links safely", () => {
    expect(sanitizeArticleHtml('<a href="https://example.com">x</a>')).toContain('rel="noopener noreferrer"');
  });
});

describe("prepareArticleBody", () => {
  it("assigns section-N ids and builds the table of contents", () => {
    const { html, toc } = prepareArticleBody("<h2>One</h2><p>a</p><h3>Two</h3><h2>Three</h2>");
    expect(toc).toEqual([
      { id: "section-0", text: "One", level: "h2" },
      { id: "section-1", text: "Two", level: "h3" },
      { id: "section-2", text: "Three", level: "h2" },
    ]);
    expect(html).toContain('<h3 id="section-1">Two</h3>');
  });

  it("lazy-loads inline images", () => {
    expect(prepareArticleBody('<p><img src="/a.jpg" alt="a"></p>').html).toContain('loading="lazy"');
  });

  it("preserves every word of the migrated BrahMos article", () => {
    const article = seed.articles[0];
    const { html, toc } = prepareArticleBody(article.body);
    expect(toc.map((t) => t.text)).toEqual([
      "Introduction",
      "Origins: The IGMDP and Dr. Kalam's Vision",
      "The Indo-Russian Partnership",
      "Development and Induction Timeline",
      "Key Features",
      "Future Developments",
    ]);
    expect(stripTags(html)).toBe(stripTags(article.body));
  });
});

describe("readingTime", () => {
  it("uses ceil(words / 200) with a minimum of 1", () => {
    expect(readingTime("")).toBe(1);
    expect(readingTime(`<p>${"word ".repeat(201)}</p>`)).toBe(2);
  });
});
