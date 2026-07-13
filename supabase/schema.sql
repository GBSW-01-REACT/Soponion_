-- =============================================================
-- Music Rating & Review Board — Supabase schema reference + RLS
--
-- The tables ALREADY EXIST in the live project
--   (https://nkgsnjsmovziksaspcwd.supabase.co).
-- >>> Run supabase/00_fixes.sql FIRST (fixes review_likes + cascades),
--     then run this file. <<<
-- This file documents that live schema and adds what's missing:
-- the signup trigger, RLS policies, seed genres, a rating view,
-- and Storage buckets. The CREATE statements use IF NOT EXISTS
-- so they are safe no-ops against the existing DB, and reproduce
-- the same shape on a fresh project.
--
-- ID convention (matches the live DB — do not change):
--   * profiles.id and every user_id / created_by  -> uuid
--   * all other PKs and their FKs                  -> bigint (int8, identity)
--   * rating                                       -> numeric
--
-- UI is Korean; identifiers/comments are English.
-- =============================================================

-- ---------- profiles ----------
-- 1:1 with auth.users. Auto-created on signup via trigger below.
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  nickname          text not null,
  profile_image_url text,
  introduction      text,
  role              text not null default 'user',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------- artists ----------
create table if not exists public.artists (
  id          bigint generated always as identity primary key,
  name        text not null,
  image_url   text,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------- genres ----------
create table if not exists public.genres (
  id         bigint generated always as identity primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- ---------- songs ----------
create table if not exists public.songs (
  id              bigint generated always as identity primary key,
  title           text not null,
  artist_id       bigint references public.artists(id) on delete set null,
  genre_id        bigint references public.genres(id) on delete set null,
  album_name      text,
  album_image_url text,
  release_date    date,
  youtube_url     text,
  created_by      uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists songs_artist_idx on public.songs(artist_id);
create index if not exists songs_genre_idx  on public.songs(genre_id);
create index if not exists songs_title_idx  on public.songs using gin (to_tsvector('simple', title));

-- ---------- reviews ----------
create table if not exists public.reviews (
  id         bigint generated always as identity primary key,
  song_id    bigint not null references public.songs(id) on delete cascade,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  rating     numeric not null check (rating >= 0.5 and rating <= 5.0 and (rating * 2) = trunc(rating * 2)),
  title      text not null,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reviews_song_idx on public.reviews(song_id);
create index if not exists reviews_user_idx on public.reviews(user_id);

-- Recommended: one review per user per song. Only apply if the live
-- data has no existing duplicates (otherwise clean them up first).
-- alter table public.reviews add constraint reviews_unique_user_song unique (song_id, user_id);

-- ---------- comments (with one-level replies) ----------
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  review_id  bigint not null references public.reviews(id) on delete cascade,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  parent_id  bigint references public.comments(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_review_idx on public.comments(review_id);
create index if not exists comments_parent_idx on public.comments(parent_id);

-- A reply must belong to the same review as its parent and cannot have its own
-- reply. This enforces the one-level reply rule at the database boundary.
create or replace function public.validate_comment_thread()
returns trigger language plpgsql as $$
declare
  parent_review_id bigint;
  parent_parent_id bigint;
begin
  if new.parent_id is null then
    return new;
  end if;
  select review_id, parent_id into parent_review_id, parent_parent_id
  from public.comments where id = new.parent_id;
  if parent_review_id is null or parent_review_id <> new.review_id then
    raise exception 'Reply parent must belong to the same review';
  end if;
  if parent_parent_id is not null then
    raise exception 'Only one reply level is allowed';
  end if;
  return new;
end; $$;

drop trigger if exists trg_comments_validate_thread on public.comments;
create trigger trg_comments_validate_thread before insert or update on public.comments
  for each row execute function public.validate_comment_thread();

-- ---------- review_likes ----------
create table if not exists public.review_likes (
  review_id  bigint not null references public.reviews(id) on delete cascade,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)   -- one like per user per review
);

-- ---------- Average rating view ----------
create or replace view public.song_rating_stats as
select
  s.id as song_id,
  coalesce(round(avg(r.rating)::numeric, 2), 0) as avg_rating,
  count(r.id) as review_count
from public.songs s
left join public.reviews r on r.song_id = s.id
group by s.id;

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_songs_updated on public.songs;
create trigger trg_songs_updated before update on public.songs
  for each row execute function public.set_updated_at();
drop trigger if exists trg_reviews_updated on public.reviews;
create trigger trg_reviews_updated before update on public.reviews
  for each row execute function public.set_updated_at();
drop trigger if exists trg_comments_updated on public.comments;
create trigger trg_comments_updated before update on public.comments
  for each row execute function public.set_updated_at();

-- ---------- Auto-create profile on signup ----------
-- Reads nickname from user metadata; falls back to email local-part.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Seed genres ----------
insert into public.genres (name) values
  ('발라드'), ('힙합'), ('댄스'), ('록'), ('R&B'),
  ('인디'), ('트로트'), ('클래식'), ('재즈'), ('K-POP')
on conflict do nothing;

-- =============================================================
-- Row Level Security
-- Read: public (anon allowed). Insert: authenticated + own row.
-- Update/Delete: owner only.
-- Policies use "if not exists" via drop-then-create to stay idempotent.
-- =============================================================
alter table public.profiles     enable row level security;
alter table public.artists      enable row level security;
alter table public.genres       enable row level security;
alter table public.songs        enable row level security;
alter table public.reviews      enable row level security;
alter table public.comments     enable row level security;
alter table public.review_likes enable row level security;

-- ----- profiles -----
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- insert handled by the signup trigger (security definer); no public insert policy needed.

-- ----- artists (any authenticated user may add; read public) -----
drop policy if exists "artists_select_all" on public.artists;
create policy "artists_select_all" on public.artists for select using (true);
drop policy if exists "artists_insert_auth" on public.artists;
create policy "artists_insert_auth" on public.artists for insert to authenticated with check (true);

-- ----- genres (read public; inserts via seed/admin) -----
drop policy if exists "genres_select_all" on public.genres;
create policy "genres_select_all" on public.genres for select using (true);
drop policy if exists "genres_insert_auth" on public.genres;
create policy "genres_insert_auth" on public.genres for insert to authenticated with check (true);

-- ----- songs -----
drop policy if exists "songs_select_all" on public.songs;
create policy "songs_select_all" on public.songs for select using (true);
drop policy if exists "songs_insert_own" on public.songs;
create policy "songs_insert_own" on public.songs for insert to authenticated with check (auth.uid() = created_by);
drop policy if exists "songs_update_own" on public.songs;
create policy "songs_update_own" on public.songs for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists "songs_delete_own" on public.songs;
create policy "songs_delete_own" on public.songs for delete using (auth.uid() = created_by);

-- ----- reviews -----
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

-- ----- comments -----
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

-- ----- review_likes -----
drop policy if exists "likes_select_all" on public.review_likes;
create policy "likes_select_all" on public.review_likes for select using (true);
drop policy if exists "likes_insert_own" on public.review_likes;
create policy "likes_insert_own" on public.review_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "likes_delete_own" on public.review_likes;
create policy "likes_delete_own" on public.review_likes for delete using (auth.uid() = user_id);

-- =============================================================
-- Storage: public buckets for images (run once).
-- =============================================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('albums',  'albums',  true)
on conflict (id) do nothing;

-- Storage policies: anyone can read. Object paths must start with auth.uid(),
-- so an authenticated member cannot overwrite or delete another member's image.
drop policy if exists "storage_read_public" on storage.objects;
create policy "storage_read_public" on storage.objects
  for select using (bucket_id in ('avatars', 'albums'));

drop policy if exists "storage_insert_auth" on storage.objects;
create policy "storage_insert_auth" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('avatars', 'albums')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_update_auth" on storage.objects;
create policy "storage_update_auth" on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'albums') and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id in ('avatars', 'albums') and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_delete_auth" on storage.objects;
create policy "storage_delete_auth" on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars', 'albums') and (storage.foldername(name))[1] = auth.uid()::text
  );
