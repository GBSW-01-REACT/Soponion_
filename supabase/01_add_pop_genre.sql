-- Add the POP genre to the existing live project.
-- Run this file once in the Supabase SQL Editor.
insert into public.genres (name)
values ('POP')
on conflict (name) do nothing;
