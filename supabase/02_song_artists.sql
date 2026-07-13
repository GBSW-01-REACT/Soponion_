-- Enable multiple artists per song.
-- Run this once in the Supabase SQL Editor.

create table if not exists public.song_artists (
  song_id    bigint not null references public.songs(id) on delete cascade,
  artist_id  bigint not null references public.artists(id) on delete cascade,
  position   integer not null default 1,
  created_at timestamptz not null default now(),
  primary key (song_id, artist_id)
);

create index if not exists song_artists_song_idx on public.song_artists(song_id);
create index if not exists song_artists_artist_idx on public.song_artists(artist_id);

alter table public.song_artists
  add column if not exists position integer not null default 1;

insert into public.song_artists (song_id, artist_id, position)
select id, artist_id, 1
from public.songs
where artist_id is not null
on conflict (song_id, artist_id) do nothing;

alter table public.song_artists enable row level security;

drop policy if exists "song_artists_select_all" on public.song_artists;
create policy "song_artists_select_all" on public.song_artists
  for select using (true);

drop policy if exists "song_artists_insert_song_owner" on public.song_artists;
create policy "song_artists_insert_song_owner" on public.song_artists
  for insert to authenticated with check (
    exists (
      select 1 from public.songs
      where songs.id = song_artists.song_id
        and songs.created_by = auth.uid()
    )
  );

drop policy if exists "song_artists_update_song_owner" on public.song_artists;
create policy "song_artists_update_song_owner" on public.song_artists
  for update to authenticated using (
    exists (
      select 1 from public.songs
      where songs.id = song_artists.song_id
        and songs.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.songs
      where songs.id = song_artists.song_id
        and songs.created_by = auth.uid()
    )
  );

drop policy if exists "song_artists_delete_song_owner" on public.song_artists;
create policy "song_artists_delete_song_owner" on public.song_artists
  for delete to authenticated using (
    exists (
      select 1 from public.songs
      where songs.id = song_artists.song_id
        and songs.created_by = auth.uid()
    )
  );
