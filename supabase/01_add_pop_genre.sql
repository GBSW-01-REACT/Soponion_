-- Add extra music genres to the existing live project.
-- Run this file once in the Supabase SQL Editor.
insert into public.genres (name)
values
  ('POP'),
  ('DNB'),
  ('EDM'),
  ('House'),
  ('Techno'),
  ('Lo-fi'),
  ('Metal'),
  ('Punk'),
  ('City Pop'),
  ('J-POP')
on conflict (name) do nothing;
