-- StratScope — initial schema
-- Replaces the Base44 entities Article, Comment and Subscriber, plus the
-- data that was hard-coded in the Base44 bundle (categories, authors).
-- Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'none' check (role in ('none', 'editor', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('editor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Prevent non-admins from changing roles (including their own).
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only administrators can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- Editorial tables
-- ---------------------------------------------------------------------------
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  title text check (char_length(title) <= 200),
  initials text check (char_length(initials) <= 6),
  bio text check (char_length(bio) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  short_name text not null check (char_length(short_name) between 1 and 40),
  domain_code text not null default '00' check (char_length(domain_code) <= 8),
  description text not null default '' check (char_length(description) <= 500),
  coming_soon_title text not null default '' check (char_length(coming_soon_title) <= 300),
  coming_soon_description text not null default '' check (char_length(coming_soon_description) <= 1000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,                       -- Base44 record id, kept for traceability
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 300),
  excerpt text not null default '' check (char_length(excerpt) <= 1000),
  body text not null default '',
  category text not null references public.categories (slug) on update cascade on delete restrict,
  author_id uuid references public.authors (id) on delete set null,
  author_name text not null default 'Pranav V Rao',  -- original free-text author field
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  featured boolean not null default false,
  hero_image text not null default '',
  hero_image_alt text not null default '',
  hero_image_credit text not null default '',
  gallery_images text[] not null default '{}',
  specifications jsonb not null default '[]'::jsonb check (jsonb_typeof(specifications) = 'array'),
  source_references text[] not null default '{}',  -- "references" in Base44 (reserved word in SQL)
  tags text[] not null default '{}',
  seo_title text not null default '' check (char_length(seo_title) <= 300),
  seo_description text not null default '' check (char_length(seo_description) <= 500),
  reading_time integer not null default 1 check (reading_time >= 0),
  published_date date,
  scheduled_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_published_idx on public.articles (status, published_date desc);
create index articles_category_idx on public.articles (category);
create index articles_tags_idx on public.articles using gin (tags);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  article_id uuid not null references public.articles (id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) between 1 and 80),
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  likes integer not null default 0 check (likes >= 0),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index comments_article_idx on public.comments (article_id, created_at desc);

create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 320),
  unsubscribe_token uuid not null default gen_random_uuid(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index subscribers_email_unique on public.subscribers (lower(email));

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 320),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();
create trigger authors_touch before update on public.authors
  for each row execute function public.touch_updated_at();
create trigger categories_touch before update on public.categories
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Visibility helper: an article is public when published, or scheduled and due.
-- ---------------------------------------------------------------------------
create or replace function public.article_is_public(a public.articles)
returns boolean language sql stable as $$
  select a.status = 'published'
      or (a.status = 'scheduled' and a.scheduled_date is not null and a.scheduled_date <= now());
$$;

-- ---------------------------------------------------------------------------
-- Narrow RPCs for anonymous visitors
-- ---------------------------------------------------------------------------
-- Increment a like without granting UPDATE on comments.
create or replace function public.like_comment(comment_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  update public.comments set likes = likes + 1
  where id = comment_id and not is_hidden
  returning likes;
$$;

-- Unsubscribe via the token in newsletter emails.
create or replace function public.unsubscribe(token uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with updated as (
    update public.subscribers set unsubscribed_at = coalesce(unsubscribed_at, now())
    where unsubscribe_token = token
    returning 1
  )
  select exists (select 1 from updated);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.authors enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;

-- profiles
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own name or admin" on public.profiles
  for update to authenticated using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

-- authors & categories: public read, editors write
create policy "authors: public read" on public.authors for select to anon, authenticated using (true);
create policy "authors: editors write" on public.authors for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

create policy "categories: public read" on public.categories for select to anon, authenticated using (true);
create policy "categories: editors write" on public.categories for all to authenticated
  using (public.is_editor()) with check (public.is_editor());

-- articles
create policy "articles: public read visible" on public.articles for select to anon, authenticated
  using (public.article_is_public(articles));
create policy "articles: editors read all" on public.articles for select to authenticated
  using (public.is_editor());
create policy "articles: editors insert" on public.articles for insert to authenticated
  with check (public.is_editor());
create policy "articles: editors update" on public.articles for update to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "articles: editors delete" on public.articles for delete to authenticated
  using (public.is_editor());

-- comments: anyone may read visible comments on public articles and post new ones
create policy "comments: public read" on public.comments for select to anon, authenticated
  using (
    not is_hidden
    and exists (select 1 from public.articles a where a.id = article_id and public.article_is_public(a))
  );
create policy "comments: editors read all" on public.comments for select to authenticated
  using (public.is_editor());
create policy "comments: public insert" on public.comments for insert to anon, authenticated
  with check (
    likes = 0 and not is_hidden
    and exists (select 1 from public.articles a where a.id = article_id and public.article_is_public(a))
  );
create policy "comments: editors moderate" on public.comments for update to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "comments: editors delete" on public.comments for delete to authenticated
  using (public.is_editor());

-- subscribers: write-only for the public (the Base44 entity was publicly listable)
create policy "subscribers: public insert" on public.subscribers for insert to anon, authenticated
  with check (unsubscribed_at is null);
create policy "subscribers: editors read" on public.subscribers for select to authenticated
  using (public.is_editor());
create policy "subscribers: editors delete" on public.subscribers for delete to authenticated
  using (public.is_editor());

-- contact messages: write-only for the public
create policy "contact: public insert" on public.contact_messages for insert to anon, authenticated
  with check (not handled);
create policy "contact: editors read" on public.contact_messages for select to authenticated
  using (public.is_editor());
create policy "contact: editors update" on public.contact_messages for update to authenticated
  using (public.is_editor()) with check (public.is_editor());
create policy "contact: editors delete" on public.contact_messages for delete to authenticated
  using (public.is_editor());

-- Column privileges: anon may only insert the columns it needs.
revoke insert, update on public.comments from anon, authenticated;
grant insert (article_id, author_name, content) on public.comments to anon, authenticated;
grant update on public.comments to authenticated;  -- still limited to editors by RLS

revoke insert on public.subscribers from anon, authenticated;
grant insert (email) on public.subscribers to anon, authenticated;

revoke insert on public.contact_messages from anon, authenticated;
grant insert (name, email, message) on public.contact_messages to anon, authenticated;

grant execute on function public.like_comment(uuid) to anon, authenticated;
grant execute on function public.unsubscribe(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: public "media" bucket, editors manage files
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do nothing;

create policy "media: public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
create policy "media: editors upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_editor());
create policy "media: editors update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_editor());
create policy "media: editors delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_editor());
