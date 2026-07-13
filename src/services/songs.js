import { supabase } from '../lib/supabase/client'
const songSelect = '*, artists(id,name), genres(id,name), profiles!songs_created_by_fkey(id,nickname,profile_image_url)'
const attachStats = async (songs) => { if (!songs?.length) return songs || []; const { data: stats, error } = await supabase.from('song_rating_stats').select('song_id,avg_rating,review_count').in('song_id', songs.map((song) => song.id)); if (error) return songs; const statsBySong = new Map((stats || []).map((stat) => [stat.song_id, stat])); return songs.map((song) => ({ ...song, song_rating_stats: [statsBySong.get(song.id) || { avg_rating: 0, review_count: 0 }] })) }
export const listSongs = async ({ query = '', genreId = '', artistId = '' } = {}) => { let request = supabase.from('songs').select(songSelect).order('created_at', { ascending: false }); if (query) request = request.ilike('title', `%${query}%`); if (genreId) request = request.eq('genre_id', genreId); if (artistId) request = request.eq('artist_id', artistId); const { data, error } = await request; return { data: error ? null : await attachStats(data), error } }
export const getSong = async (id) => { const { data, error } = await supabase.from('songs').select(songSelect).eq('id', id).single(); if (error) return { data: null, error }; return { data: (await attachStats([data]))[0], error: null } }
export const createSong = async (payload) => supabase.from('songs').insert(payload).select().single()
export const updateSong = async (id, payload) => supabase.from('songs').update(payload).eq('id', id).select().single()
export const deleteSong = async (id) => supabase.from('songs').delete().eq('id', id)
export const listGenres = async () => supabase.from('genres').select('*').order('name')
export const listArtists = async () => supabase.from('artists').select('*').order('name')
export const createArtist = async (name) => supabase.from('artists').insert({ name }).select().single()
