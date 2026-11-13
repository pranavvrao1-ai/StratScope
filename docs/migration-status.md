# Migration Status

Last updated: 2026-11-13 · Branch `feat/base44-exit`

## Summary

| Area | Status | Notes |
| --- | --- | --- |
| Published articles (1) | ✅ Migrated, verified field by field | `npm run verify:migration` |
| Draft / scheduled articles | ⚠️ **Not retrievable** | Base44's public API returns only published records. Export from the Base44 dashboard if any exist (see below). |
| Comments (2) | ✅ Migrated verbatim | Names, text, likes and timestamps preserved |
| Categories (4) | ✅ Migrated verbatim | Recovered from the bundle; now editable in Admin → Categories |
| Authors (1) | ✅ | Pranav V Rao, "Founder & Editor-in-Chief, StratScope", PVR |
| Static pages and copy | ✅ Verbatim | Home, About, Contact, footer, nav, email templates, "Coming Next" banner |
| Images (5) | ✅ Byte-identical copies | Checksums in `migration/base44-export/asset-checksums.txt` |
| URLs | ✅ Unchanged | No redirects needed (see page-inventory.md) |
| Subscribers | ⚠️ Not exported | None were publicly visible. Export from the dashboard if you have any. |
| User accounts | ➖ Not migratable | Re-invite editors (deployment guide §1.6) |
| Base44 SDK, auth, entities, integrations, storage, analytics | ✅ Removed | Guarded by `tests/no-base44.test.ts` and `verify:routes` |

## Base44 dependencies replaced

| Base44 feature (found in bundle) | Replacement |
| --- | --- |
| `@base44/sdk` client (`entities.Article/Comment/Subscriber`) | Supabase Postgres tables with RLS; server-side repository (`src/lib/content/repository.ts`) |
| Base44 auth (`loginViaEmailPassword`, `loginWithProvider("google")`, route guard) | Supabase Auth (email/password, optional Google) + `profiles.role` (none/editor/admin) |
| `integrations.Core.UploadFile` → `media.base44.com` | Supabase Storage bucket `media` (editors only) |
| `integrations.Core.SendEmail` (welcome + new-article mails) | Resend HTTP API (`src/lib/email.ts`), same copy, plus unsubscribe links |
| `Comment.subscribe` realtime | Removed. New comments appear immediately for the poster; others see them on the next page render. |
| `/api/app-logs/.../log-user-in-app` analytics + Base44 consent script | Removed. No tracking was added. |
| Base44 hosting, `manifest.json`, favicons on `media.base44.com` | Vercel + self-hosted icons/manifest |
| Quill editor (react-quill) | Tiptap (compatible HTML; existing article HTML renders unchanged) |

## Behaviour changes (deliberate)

1. **Contact form now delivers messages.** The original only displayed "Message Sent". Messages are stored (Admin → Messages) and optionally emailed.
2. **Home-page newsletter form now subscribes.** The original section only displayed "Thank you".
3. **Security fixes over the original:**
   - Subscribers and contact messages are write-only for the public. The Base44 `Subscriber` list endpoint was publicly readable.
   - Comment likes go through a database function instead of a client-side update of any field.
   - Article HTML is sanitised server-side.
   - Admin requires an editor role, not merely being signed in.
4. **Scheduled articles go live automatically** when their scheduled date passes. In the original they never appeared publicly.
5. **Autosave applies to drafts only.** The original also autosaved published articles every 5 s, pushing half-finished edits live.
6. **Hero image shown in a 16:9 frame (object-contain).** The original used the image's natural height. This avoids layout shift; the brand frame (black, bordered, rounded) is kept.
7. **Article `<title>`** no longer doubles the suffix ("… — StratScope — StratScope").
8. **Fonts self-hosted** via `next/font` (same families: Playfair Display, DM Sans, JetBrains Mono).
9. **Base44's default 404 text** ("Ask [the AI] to implement it…") was replaced by a branded 404.
10. **Framer Motion not used.** The original had no JavaScript animations, only CSS transitions, which are reproduced as-is. Adding the library would only add bytes.

## Verification performed (2026-11-13)

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | ✅ pass |
| ESLint | `npm run lint` | ✅ 0 problems |
| Unit/integration tests | `npm test` | ✅ 24/24 |
| Migration fidelity (seed data + images) | `npm run verify:migration` | ✅ all checks |
| Production build | `npm run build` | ✅ all public pages prerendered |
| Routes, SEO, images, links, 404s, admin protection, security headers, no-Base44 | `npm run verify:routes` against `next start` | ✅ 178/178 checks |
| Responsive | Browser at 375 px and desktop | ✅ no horizontal page overflow; specs table scrolls in its own container |
| Hydration / console errors | Browser console on the article page | ✅ none |
| Production dependency audit | `npm audit --omit=dev` | ✅ 0 vulnerabilities (7 moderate remain in dev-only ESLint tooling) |

### Not yet verified, because no Supabase project exists yet

- The SQL migration and `seed.sql` running against a real Supabase instance. Run `npm run verify:migration:db` after setup.
- Real sign-in, the RLS policies end to end, uploads to Storage, and email delivery. Server-side authorisation logic is covered by `tests/authorization.test.ts` with a mocked client.

Do these checks right after completing the deployment guide. Suggested manual pass:
1. Sign in.
2. Create a draft and upload a hero image and an inline image.
3. Preview it, publish it and confirm it appears on `/`.
4. Unpublish it.
5. Post a comment and like it.
6. Subscribe, and send a contact message.
7. Confirm a signed-in account **without** a role is refused at `/admin`.

## Importing additional Base44 exports

If you export Article or Comment data from the Base44 dashboard (JSON or CSV converted to JSON with the same field names):

1. Merge the records into `migration/base44-export/articles.json` / `comments.json`. Keep the Base44 `id`s.
2. Download any new `media.base44.com` images into `public/images/migrated/`, keeping their file names.
3. Regenerate and verify:
   ```bash
   npm run seed:build
   ```
   ```bash
   npm run verify:migration
   ```
4. Run the regenerated `supabase/seed.sql`. Existing rows are skipped, because inserts are keyed on `legacy_id`.

## Users and authentication

Base44 does not expose password hashes, so accounts cannot be transferred. Invite each editor from Supabase (Authentication → Users → Invite) and assign a role under **Admin → Team**. Public sign-up is disabled by design.
