# Deployment Guide

Target setup: **Supabase** (database, auth, storage) + **Vercel** (Next.js hosting), both on accounts you own. Budget about 30 minutes.

## 1. Create the Supabase project

1. Create a project at supabase.com. Pick a region close to your readers.
2. **Apply the schema.** Use either option:
   - **Supabase CLI:**
     ```bash
     npx supabase link --project-ref <your-project-ref>
     ```
     ```bash
     npx supabase db push
     ```
   - **SQL editor:** paste and run `supabase/migrations/20261113000000_initial_schema.sql`.
3. **Load the migrated content:** run `supabase/seed.sql` in the SQL editor. It is idempotent, so running it again is safe.
4. **Verify the import record by record**, from your machine with the service-role key in `.env.local`:
   ```bash
   npm run verify:migration:db
   ```
5. **Auth settings** (Authentication → URL Configuration):
   - **Site URL:** `https://your-domain`
   - **Redirect URLs:** `https://your-domain/auth/callback`, `http://localhost:3000/auth/callback`
   - Under Authentication → Providers → Email, **disable "Allow new users to sign up"**. Editors are invited only.
6. **Create your administrator account:**
   1. Go to Authentication → Users → **Invite user**, enter your email and accept the invite. The link lands on `/auth/callback`; set a password through "Forgot password?" on `/login` if asked.
   2. In the SQL editor, give yourself the admin role:
      ```sql
      update public.profiles set role = 'admin' where email = 'you@example.com';
      ```
   3. Later editors: invite them the same way, then promote them under **Admin → Team**.
7. **Optional Google sign-in:** enable the Google provider in Supabase, then set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true`.

## 2. Deploy to Vercel

1. Import the GitHub repository `pranavvrao1-ai/StratScope` in Vercel. The framework preset is detected as Next.js.
2. Add the environment variables from `.env.example`: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally the `RESEND_*` / `EMAIL_FROM` / `CONTACT_INBOX` values.
   - **Do not** add `SUPABASE_SERVICE_ROLE_KEY`. The app never uses it.
3. Deploy. Build command `npm run build`; Node 20.9 or newer.
4. Smoke-test the live deployment:
   ```bash
   BASE_URL=https://your-domain npm run verify:routes
   ```

## 3. Domain

1. Vercel → Project → Domains → add your domain, then create the DNS records it shows: an `A`/`CNAME` for the apex, and `CNAME` for `www`.
2. Set `NEXT_PUBLIC_SITE_URL` to the final canonical domain and redeploy. Canonical URLs, the sitemap and email links use it.
3. Update the Supabase Site URL and Redirect URLs to the same domain.
4. Submit `https://your-domain/sitemap.xml` in Google Search Console.
5. **Moving off the Base44 URL:** `strat-scope-intel.base44.app` is a Base44 subdomain, so you cannot add redirects there. All paths are identical on the new domain (`/articles/<slug>`, `/category/<slug>`, `/about`, `/contact`). Update any links you control and announce the new address. Once the new site is verified, unpublish the Base44 app.

## 4. Email (optional)

1. Create a Resend account and verify your sending domain (it adds DNS records).
2. Set `RESEND_API_KEY` and `EMAIL_FROM`.

With these set, the site sends:
- **Welcome email** on subscription.
- **Newsletter** to all active subscribers when an article is first published. Each newsletter has an unsubscribe link.
- **Contact-form notification** to `CONTACT_INBOX`.

Without these keys, email is skipped and everything else still works.

## 5. Storage

The migration creates a public `media` bucket. Images up to 8 MB in JPEG, PNG, WebP, GIF or AVIF are accepted, and only editors can upload, change or delete them.

The original Base44 images are committed in `public/images/migrated/` and served by Vercel, so they don't depend on the bucket.

## 6. Backups

- **Database:** Supabase takes daily backups on paid plans; enable Point-in-Time Recovery if the content matters commercially. On the free plan, schedule your own dumps, e.g. weekly:
  ```bash
  npx supabase db dump --data-only -f backups/stratscope-$(date +%F).sql
  ```
- **Media:** download the `media` bucket periodically (Supabase dashboard or `supabase storage` CLI).
- **Code and original content:** Git. `migration/base44-export/` is the immutable copy of the original Base44 data.

## 7. Rollback

- **Application:** Vercel → Deployments → pick the previous good deployment → **Promote to Production**. Takes effect instantly; no rebuild.
- **Content edits:** restore from a Supabase backup or PITR. A single article can be re-imported from `supabase/seed.sql` if it was part of the original migration.
- **Schema:** migrations are additive. To undo a change, write a new migration that reverses it; never edit an applied migration.
- **Emergency fallback:** set `CONTENT_SOURCE=seed` in Vercel and redeploy. The public site then serves the migrated content read-only from the repository, with no database.

## 8. Local development against Supabase

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key.
2. Run `npm run dev`. Sign in at `/login`; the admin panel is at `/admin`.
