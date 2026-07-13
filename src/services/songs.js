import { supabase } from '../lib/supabase/client'
const defaultGenreNames = ['발라드', '힙합', '댄스', '록', 'R&B', '인디', '트로트', '클래식', '재즈', 'K-POP', 'POP', 'DNB', 'EDM', 'House', 'Techno', 'Lo-fi', 'Metal', 'Punk', 'City Pop', 'J-POP']
const songSelect = '*, artists(id,name), genres(id,name), profiles!songs_created_by_fkey(id,nickname,profile_image_url)'
const attachStats = async (songs) => { if (!songs?.length) return songs || []; const { data: stats, error } = await supabase.from('song_rating_stats').select('song_id,avg_rating,review_count').in('song_id', songs.map((song) => song.id)); if (error) return songs; const statsBySong = new Map((stats || []).map((stat) => [stat.song_id, stat])); return songs.map((song) => ({ ...song, song_rating_stats: [statsBySong.get(song.id) || { avg_rating: 0, review_count: 0 }] })) }
export const listSongs = async ({ query = '', genreId = '', artistId = '' } = {}) => { let request = supabase.from('songs').select(songSelect).order('created_at', { ascending: false }); if (query) request = request.ilike('title', `%${query}%`); if (genreId) request = request.eq('genre_id', genreId); if (artistId) request = request.eq('artist_id', artistId); const { data, error } = await request; return { data: error ? null : await attachStats(data), error } }
export const getSong = async (id) => { const { data, error } = await supabase.from('songs').select(songSelect).eq('id', id).single(); if (error) return { data: null, error }; return { data: (await attachStats([data]))[0], error: null } }
export const createSong = async (payload) => supabase.from('songs').insert(payload).select().single()
export const updateSong = async (id, payload) => supabase.from('songs').update(payload).eq('id', id).select().single()
export const deleteSong = async (id) => supabase.from('songs').delete().eq('id', id)
export const ensureDefaultGenres = async () => {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return { data: null, error: null }

  return supabase.from('genres').upsert(
    defaultGenreNames.map((name) => ({ name })),
    { onConflict: 'name', ignoreDuplicates: true },
  )
}
export const listGenres = async ({ ensureDefaults = false } = {}) => {
  if (ensureDefaults) {
    const ensureResult = await ensureDefaultGenres()
    if (ensureResult.error) return ensureResult
  }

  const result = await supabase.from('genres').select('*').order('name')
  if (result.error) return result

  return result
}
export const listArtists = async () => supabase.from('artists').select('*').order('name')
export const findArtistByName = async (name) => supabase.from('artists').select('*').ilike('name', name.trim()).limit(1).maybeSingle()
export const getOrCreateArtist = async (name) => { const normalizedName = name.trim(); if (!normalizedName) return { data: null, error: new Error('아티스트 이름을 입력해주세요.') }; if (normalizedName.length > 80) return { data: null, error: new Error('아티스트 이름은 80자 이하로 입력해주세요.') }; const existing = await findArtistByName(normalizedName); if (existing.error) return existing; if (existing.data) return existing; return supabase.from('artists').insert({ name: normalizedName }).select().single() }
