# StratScope

Independent defence technology publication — the self-hosted successor to the Base44 app at `strat-scope-intel.base44.app`.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, RLS) · Tiptap editor · Resend (optional email) · Vercel.

There is **no runtime dependency on Base44**. All content, images and behaviour were migrated. See [`docs/`](docs/) for the full record.

## Quick start (no database needed)

```bash
npm install
```

```bash
npm run dev
```

Without Supabase credentials the site runs in **seed mode**: every public page renders from the migrated content in `src/lib/content/seed-data.json`. The admin panel, comments, newsletter and contact form need Supabase (see [docs/deployment-guide.md](docs/deployment-guide.md)).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm test` | Vitest: sanitiser, migration fidelity, repository, admin authorisation, no-Base44 guard |
| `npm run verify:migration` | Record-by-record check of seed data and images against the raw Base44 export |
| `npm run verify:migration:db` | The same checks against the live Supabase database |
| `npm run verify:routes` | HTTP checks against a running server (`BASE_URL=…`): pages, SEO, images, links, 404s, admin protection |
| `npm run seed:build` | Regenerate `seed-data.json` and `supabase/seed.sql` from `migration/base44-export/` |
| `npm run check` | typecheck + lint + test + verify:migration + build |

## Layout

```
src/app/(site)/        public pages: /, /articles/[slug], /category/[slug], /about, /contact, /unsubscribe
src/app/admin/         editorial admin (editors/admins only)
src/app/login, auth/   Supabase Auth sign-in, password reset, callback
src/app/actions/       Server Actions (public forms, admin mutations, auth)
src/components/site/   public UI (header, footer, cards, article view, comments, newsletter)
src/components/admin/  admin UI (article editor, rich-text editor, managers)
src/lib/               content repository, Supabase clients, auth, HTML sanitiser, validation, email
supabase/migrations/   database schema + RLS policies + storage bucket
supabase/seed.sql      migrated Base44 content (generated)
migration/             raw Base44 export (source of truth for the migration)
scripts/               seed builder and verification scripts
docs/                  inventories, migration status, deployment guide
```
