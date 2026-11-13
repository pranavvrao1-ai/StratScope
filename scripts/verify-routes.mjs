#!/usr/bin/env node
// HTTP-level verification of a running StratScope instance.
//   BASE_URL=http://localhost:3000 node scripts/verify-routes.mjs
// Checks every public route, SEO metadata, structured data, images, internal
// links, the sitemap/robots files and that /admin is not publicly reachable.
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "  ✓" : "  ✗"} ${msg}`);
  if (!ok) failures++;
};

async function get(path, opts = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", ...opts });
  const type = res.headers.get("content-type") || "";
  const body = type.includes("text") || type.includes("json") || type.includes("xml") ? await res.text() : "";
  return { status: res.status, headers: res.headers, body };
}

const meta = (html, attr, name) =>
  html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, "i"))?.[1] ??
  html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, "i"))?.[1];
const decode = (s) => s?.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

const pages = [
  {
    path: "/",
    title: "StratScope — Defence Technology Intelligence",
    contains: [
      "Understanding Defence Technology,",
      "One Platform at a Time.",
      "BrahMos: The Game Changer",
      "Varunastra — India&#x27;s Heavyweight Torpedo",
      "Latest Articles",
      "Explore Categories",
      "Trending Topics",
      "Subscribe to the StratScope Newsletter",
      "Next-Gen Subsurface Combatants &amp; Autonomous Arrays",
      "1<!-- --> published · <!-- -->3<!-- --> in preparation",
    ],
  },
  {
    path: "/articles/brahmos-the-game-changer",
    title: "BrahMos: The Game Changer — StratScope",
    contains: [
      "With wars shifting from melees to AI-controlled light machine guns",
      'id="section-0"',
      "SYSTEM INDEX",
      "TACTICAL PARAMETER INDEX",
      "Mach 2.8 – 3.5 (approx. 3,700 km/h)",
      "VERIFIED INTEL REFERENCES",
      "BrahMos Aerospace official documentation",
      "VISUAL INTELLIGENCE",
      "Founder &amp; Editor-in-Chief, StratScope",
      "JULY 16, 2026",
      "Sudhanva",
      "Nice article… good information",
    ],
    jsonLd: "Article",
  },
  { path: "/category/missile-technology", title: "Missile Technology — StratScope", contains: ["DOMAIN // <!-- -->04", "BrahMos: The Game Changer"] },
  { path: "/category/naval-technology", title: "Naval Technology — StratScope", contains: ["INTEL ANALYSIS IN PREPARATION", "Naval Technology"] },
  { path: "/category/air-power", title: "Air Power — StratScope", contains: ["INTEL ANALYSIS IN PREPARATION"] },
  { path: "/category/land-systems", title: "Land Systems — StratScope", contains: ["INTEL ANALYSIS IN PREPARATION"] },
  { path: "/about", title: "About — StratScope", contains: ["ABOUT STRATSCOPE", "not affiliated with any government"] },
  { path: "/contact", title: "Contact — StratScope", contains: ["pranavvrao1@gmail.com", "Send Message"] },
  { path: "/login", title: "Sign in — StratScope", contains: ["Secure Control Panel"], noindex: true },
];

const internalLinks = new Set();
const images = new Set();

console.log(`Verifying ${BASE}\n`);
for (const p of pages) {
  console.log(`[${p.path}]`);
  const { status, body } = await get(p.path);
  check(status === 200, `status ${status}`);
  const title = decode(body.match(/<title>([^<]*)<\/title>/)?.[1]);
  check(title === p.title, `title "${title}"`);
  for (const c of p.contains) check(body.includes(c), `contains ${JSON.stringify(c.slice(0, 60))}`);
  const h1s = body.match(/<h1[\s>]/g)?.length ?? 0;
  check(h1s === 1, `exactly one <h1> (found ${h1s})`);
  if (p.noindex) check(/<meta name="robots" content="noindex/.test(body), "noindex");
  else {
    check(!!meta(body, "name", "description"), "meta description");
    check(!!meta(body, "property", "og:title"), "og:title");
    check(!!meta(body, "property", "og:image"), "og:image");
    check(!!meta(body, "name", "twitter:card"), "twitter:card");
    const canonical = body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    check(!!canonical && canonical.endsWith(p.path === "/" ? "" : p.path), `canonical ${canonical}`);
  }
  if (p.jsonLd) check(body.includes(`"@type":"${p.jsonLd}"`), `JSON-LD ${p.jsonLd}`);
  for (const m of body.matchAll(/href="(\/[^"#?]*)/g)) if (!m[1].startsWith("/_next")) internalLinks.add(m[1]);
  for (const m of body.matchAll(/<img[^>]*?\s(?:src|srcSet|srcset)="([^"]+)"/g))
    for (const part of m[1].split(",")) {
      const url = part.trim().split(" ")[0].replace(/&amp;/g, "&");
      if (url.startsWith("/")) images.add(url);
    }
  for (const m of body.matchAll(/imageSrcSet="([^"]+)"/gi)) for (const part of m[1].split(",")) images.add(part.trim().split(" ")[0].replace(/&amp;/g, "&"));
}

console.log("\n[404 handling]");
check((await get("/articles/does-not-exist")).status === 404, "unknown article → 404");
check((await get("/category/does-not-exist")).status === 404, "unknown category → 404");
check((await get("/no-such-page")).status === 404, "unknown page → 404");

console.log("\n[admin protection]");
const admin = await get("/admin");
check(admin.status === 307 || admin.status === 302, `/admin redirects (status ${admin.status})`);
check((admin.headers.get("location") || "").includes("/login"), `→ ${admin.headers.get("location")}`);
const adminEdit = await get("/admin/articles/new");
check([302, 307].includes(adminEdit.status), `/admin/articles/new redirects (status ${adminEdit.status})`);

console.log("\n[internal links]");
for (const link of [...internalLinks].sort()) {
  const { status } = await get(link);
  check([200, 307, 308].includes(status), `${link} → ${status}`);
}

console.log("\n[images]");
for (const src of [...images].sort()) {
  const res = await fetch(BASE + src);
  const type = res.headers.get("content-type") || "";
  check(res.ok && type.startsWith("image/"), `${src.slice(0, 90)} → ${res.status} ${type}`);
}

console.log("\n[SEO files]");
const sitemap = await get("/sitemap.xml");
check(sitemap.status === 200 && sitemap.body.includes("/articles/brahmos-the-game-changer"), "sitemap lists the article");
for (const c of ["naval-technology", "air-power", "land-systems", "missile-technology"])
  check(sitemap.body.includes(`/category/${c}`), `sitemap lists /category/${c}`);
const robots = await get("/robots.txt");
check(robots.status === 200 && robots.body.includes("Disallow: /admin") && robots.body.includes("Sitemap:"), "robots.txt");
const manifest = await get("/manifest.webmanifest");
check(manifest.status === 200 && manifest.body.includes('"StratScope"'), "web manifest");
const search = await get("/api/search-index");
check(search.status === 200 && JSON.parse(search.body).articles.length >= 1, "search index");

console.log("\n[security headers]");
const home = await get("/");
for (const h of ["x-content-type-options", "x-frame-options", "referrer-policy", "strict-transport-security"])
  check(!!home.headers.get(h), `${h}: ${home.headers.get(h)}`);
check(!home.headers.get("x-powered-by"), "no x-powered-by");

console.log("\n[no Base44 at runtime]");
for (const p of pages) {
  const { body } = await get(p.path);
  check(!/base44/i.test(body), `${p.path} has no Base44 references`);
}

console.log(failures ? `\n✗ ${failures} check(s) failed` : "\n✓ All route checks passed");
process.exit(failures ? 1 : 0);
