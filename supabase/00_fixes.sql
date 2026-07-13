-- =============================================================
-- 00_fixes.sql — corrective migration for the live schema
-- Run this ONCE in the Supabase SQL editor BEFORE building features.
-- Then run schema.sql for RLS, trigger, buckets, and seed data.
-- =============================================================

-- -------------------------------------------------------------
-- FIX 1 (critical): review_likes was created as an identity PK.
-- As shipped, review_id is GENERATED ALWAYS AS IDENTITY with
-- PRIMARY KEY (review_id), which makes it impossible to like a
-- specific review or to prevent duplicate likes. It must be a
-- pure join table: (review_id, user_id) composite PK, review_id
-- a plain FK to reviews(id).
--
-- This DROPs and recreates the table. Safe only if it holds no
-- real data yet (it can't, given the broken definition).
-- -------------------------------------------------------------
drop table if exists public.review_likes cascade;

create table public.review_likes (
  review_id  bigint not null references public.reviews(id) on delete cascade,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- -------------------------------------------------------------
-- FIX 2 (recommended): add ON DELETE CASCADE to child FKs so
-- deleting a song/review/profile doesn't fail on dependent rows.
-- The live FKs use the default NO ACTION. Re-point them.
-- -------------------------------------------------------------

-- songs.created_by -> profiles
alter table public.songs drop constraint if exists songs_created_by_fkey;
alter table public.songs
  add constraint songs_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete cascade;

-- reviews.song_id -> songs
alter table public.reviews drop constraint if exists reviews_song_id_fkey;
alter table public.reviews
  add constraint reviews_song_id_fkey
  foreign key (song_id) references public.songs(id) on delete cascade;

-- reviews.user_id -> profiles
alter table public.reviews drop constraint if exists reviews_user_id_fkey;
alter table public.reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- comments.review_id -> reviews
alter table public.comments drop constraint if exists comments_review_id_fkey;
alter table public.comments
  add constraint comments_review_id_fkey
  foreign key (review_id) references public.reviews(id) on delete cascade;

-- comments.user_id -> profiles
alter table public.comments drop constraint if exists comments_user_id_fkey;
alter table public.comments
  add constraint comments_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- comments.parent_id -> comments (delete a comment removes its replies)
alter table public.comments drop constraint if exists comments_parent_id_fkey;
alter table public.comments
  add constraint comments_parent_id_fkey
  foreign key (parent_id) references public.comments(id) on delete cascade;

-- -------------------------------------------------------------
-- FIX 3 (recommended): enforce one review per user per song.
-- Apply only if there are no existing duplicates.
-- -------------------------------------------------------------
alter table public.reviews drop constraint if exists reviews_unique_user_song;
alter table public.reviews
  add constraint reviews_unique_user_song unique (song_id, user_id);
