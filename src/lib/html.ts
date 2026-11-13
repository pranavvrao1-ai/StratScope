import sanitizeHtml from "sanitize-html";

/**
 * Allow-list for article bodies. Covers everything the original Quill editor
 * (and the new Tiptap editor) can produce; strips scripts, event handlers,
 * inline styles and javascript: URLs.
 */
const ARTICLE_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup",
    "ul", "ol", "li", "blockquote", "pre", "code", "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td", "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["class", "style"],
  },
  // Only text alignment survives in inline styles (produced by the editor's align buttons).
  allowedStyles: {
    "*": { "text-align": [/^(left|right|center|justify)$/] },
  },
  allowedClasses: {
    "*": ["ql-align-center", "ql-align-right", "ql-align-justify", "ql-syntax", "text-left", "text-center", "text-right", "text-justify"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const external = /^https?:\/\//i.test(attribs.href ?? "");
      return {
        tagName,
        attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
      };
    },
  },
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html ?? "", ARTICLE_SANITIZE);
}

export function stripTags(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(html: string): number {
  const text = stripTags(html);
  return text ? text.split(/\s+/).length : 0;
}

/** Same formula the original editor used: ceil(words / 200), minimum 1. */
export function readingTime(html: string): number {
  return Math.max(1, Math.ceil(wordCount(html) / 200));
}

export interface TocItem {
  id: string;
  text: string;
  level: "h2" | "h3";
}

/**
 * Sanitises the body, gives every h2/h3 a stable id and returns the table of
 * contents. Ids follow the original site's `section-N` scheme so old deep
 * links (/articles/x#section-2) keep working. Also lazy-loads inline images.
 */
export function prepareArticleBody(html: string): { html: string; toc: TocItem[] } {
  const clean = sanitizeArticleHtml(html);
  const toc: TocItem[] = [];
  let index = 0;
  const withIds = clean.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag: string, attrs: string, inner: string) => {
    const id = `section-${index++}`;
    const level = tag.toLowerCase() as "h2" | "h3";
    toc.push({ id, text: stripTags(inner), level });
    const cleanedAttrs = attrs.replace(/\sid="[^"]*"/i, "");
    return `<${level} id="${id}"${cleanedAttrs}>${inner}</${level}>`;
  });
  const lazy = withIds.replace(/<img(?![^>]*\sloading=)/gi, '<img loading="lazy" decoding="async"');
  return { html: lazy, toc };
}
