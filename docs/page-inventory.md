# Page Inventory

Routes recovered from the original React Router configuration in the production bundle.

| Original route | Purpose | New route | Status |
| --- | --- | --- | --- |
| `/` | Home: hero, latest-article strip, "Coming Next" banner, Latest Articles grid with "in preparation" cards, Explore Categories, Trending Topics, newsletter | `/` | ✅ Rebuilt, same sections and copy |
| `/articles/:slug` | Article: meta line, title, excerpt, byline, hero, System Index (TOC), Share Intel, body, Visual Intelligence gallery, Tactical Parameter Index (specs), Verified Intel References, Comments, Related Intelligence | `/articles/[slug]` | ✅ Same URL scheme; server-rendered |
| `/category/:slug` | Category: domain code, name, description, article grid; "Intel analysis in preparation" state; Naval Technology shows the Coming Next banner | `/category/[slug]` | ✅ |
| `/about` | About StratScope (Foundational Statement) | `/about` | ✅ Copy verbatim |
| `/contact` | Contact copy + form (name, email, message) | `/contact` | ✅ Copy verbatim. **Behaviour change:** the original form only showed a success message and never stored or sent anything. Messages are now stored in `contact_messages` and optionally emailed. |
| `/login` | Base44 login (email/password, Google, "Create one", "Forgot password?") | `/login` | ✅ Supabase Auth. Public sign-up deliberately removed: editors are invited (see deployment guide). Google sign-in can be enabled via env flag. |
| `/admin` | "Authenticated Console — StratScope Secure Control Panel": Article Command list + editor | `/admin` (+ sub-pages) | ✅ Expanded: articles, categories, tags, authors, comments, subscribers, messages, team |
| `*` | Base44 default 404 ("This could mean that the AI hasn't implemented this page yet…") | `not-found` | ✅ Replaced with a branded 404 (the Base44 text was platform boilerplate, not editorial content) |

No other public routes, query-string routes or legacy URLs exist in the bundle, so **no redirects are required**: every original URL is preserved one-to-one.

## Global UI

| Element | Original behaviour | Rebuilt |
| --- | --- | --- |
| Header | Sticky, blurred; STRAT**SCOPE** wordmark + "INTEL CORE" badge; mono uppercase nav (Home, Naval Tech, Air Power, Land Systems, Missiles, About, Contact); search button; mobile menu; gold scroll-progress line | ✅ |
| Search dialog | "SEARCH INTELLIGENCE DATABASE…" over published articles (title/excerpt/category) and categories | ✅ (`/api/search-index`) |
| Footer | Wordmark + mission line; Tactical Domains; Resources; System Status; © year | ✅ Copy verbatim |
| Newsletter prompt | Bottom-right card after 4 s, dismissal remembered in `localStorage` key `stratscope_email_prompt_dismissed` | ✅ Same key, same copy; now stores the subscriber in Postgres |
| Home newsletter section | "Subscribe to the StratScope Newsletter" | ✅ **Behaviour change:** the original section only showed "Thank you" and never saved the email. It now subscribes for real. |
| Comment likes | One like per browser (`localStorage` key `stratscope_liked_comments`) | ✅ Same key; increment done by a database function instead of an unrestricted client-side update |

## Copy recovered verbatim

All public strings (hero heading "Understanding Defence Technology, One Platform at a Time.", intro paragraphs, About statement, contact text and address, footer text, section labels such as SYSTEM INDEX / SHARE INTEL / VISUAL INTELLIGENCE / TACTICAL PARAMETER INDEX / VERIFIED INTEL REFERENCES / RELATED INTELLIGENCE, empty states, email templates) were copied directly from the bundle into the new components.

## Metadata recovered

| Item | Value |
| --- | --- |
| `<title>` | StratScope — Defence Technology Intelligence |
| description | "StratScope — An independent defence technology publication and knowledge base. Documenting military technology, naval systems, aerospace, missile technology, space systems, cybersecurity, and AI in defence using publicly available information." |
| keywords | defence technology, military technology, missile technology, naval systems, aerospace, cybersecurity, AI defence, strategic analysis, country profiles |
| author | Pranav V Rao |
| og:title / twitter:title | StratScope — Defence Technology Intelligence |
| og/twitter description | "An independent educational defence technology publication dedicated to documenting and explaining existing military technologies using publicly available information." |
| Article `<title>` | `${seo_title || title} — StratScope` (note: the stored seo_title already ends in "— StratScope"; the new site avoids the doubled suffix) |
| Manifest | name/short_name StratScope, theme `#000000` |
