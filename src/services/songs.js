import { supabase } from '../lib/supabase/client'

const defaultGenreNames = ['발라드', '힙합', '댄스', '록', 'R&B', '인디', '트로트', '클래식', '재즈', 'K-POP', 'POP', 'DnB', 'EDM', 'House', 'Techno', 'Lo-fi', 'Metal', 'Punk', 'City Pop', 'J-POP']
const baseSongSelect = '*, artists(id,name), genres(id,name), profiles!songs_created_by_fkey(id,nickname,profile_image_url)'
const songSelect = `${baseSongSelect}, song_artists(artist_id, position, artists(id,name))`

const normalizeText = (value) => value?.trim().replace(/\s+/g, ' ').toLocaleLowerCase() || ''
const normalizeArtistIds = (artistIds = []) => [...new Set(artistIds.map((id) => Number(id)).filter(Boolean))].sort((a, b) => a - b)

export const getSongArtists = (song) => {
  const joinedArtists = (song?.song_artists || [])
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((item) => item.artists)
    .filter(Boolean)

  if (joinedArtists.length) return joinedArtists
  return song?.artists ? [song.artists] : []
}

export const getSongArtistNames = (song) => {
  const names = getSongArtists(song).map((artist) => artist.name).filter(Boolean)
  return names.length ? names.join(', ') : '가수 미정'
}

const attachStats = async (songs) => {
  if (!songs?.length) return songs || []

  const { data: stats, error } = await supabase.from('song_rating_stats').select('song_id,avg_rating,review_count').in('song_id', songs.map((song) => song.id))
  if (error) return songs

  const statsBySong = new Map((stats || []).map((stat) => [stat.song_id, stat]))
  return songs.map((song) => ({ ...song, song_rating_stats: [statsBySong.get(song.id) || { avg_rating: 0, review_count: 0 }] }))
}

const fallbackSongArtists = (songs) => songs.map((song) => ({
  ...song,
  song_artists: song.song_artists || (song.artists ? [{ song_id: song.id, artist_id: song.artists.id, position: 1, artists: song.artists }] : []),
}))

const hydrateSongs = async (songs) => attachStats(fallbackSongArtists(songs || []))

const selectSongs = async (requestBuilder) => {
  const result = await requestBuilder(songSelect)
  if (!result.error) return result

  // If the live DB has not run the new song_artists migration yet, keep old
  // single-artist reads working instead of making the entire app blank.
  const fallback = await requestBuilder(baseSongSelect)
  return fallback
}

const sameArtists = (left, right) => left.length === right.length && left.every((id, index) => id === right[index])
const isMissingSongArtistsError = (error) => {
  const message = error?.message || ''
  return message.includes('song_artists') && (message.includes('schema cache') || message.includes('Could not find') || message.includes('does not exist'))
}

const isDuplicateSong = (song, title, artistIds) => {
  if (normalizeText(song.title) !== normalizeText(title)) return false
  const existingArtistIds = normalizeArtistIds(getSongArtists(song).map((artist) => artist.id))
  return sameArtists(existingArtistIds, artistIds)
}

export const findDuplicateSong = async ({ title, artistIds = [], excludeId = null }) => {
  const normalizedArtistIds = normalizeArtistIds(artistIds)
  if (!normalizeText(title) || !normalizedArtistIds.length) return { data: null, error: null }

  const { data, error } = await selectSongs((select) => {
    let request = supabase.from('songs').select(select).ilike('title', title.trim())
    if (excludeId) request = request.neq('id', excludeId)
    return request
  })

  if (error) return { data: null, error }
  return { data: (data || []).find((song) => isDuplicateSong(song, title, normalizedArtistIds)) || null, error: null }
}

const syncSongArtists = async (songId, artistIds) => {
  const normalizedArtistIds = normalizeArtistIds(artistIds)
  const deleteResult = await supabase.from('song_artists').delete().eq('song_id', songId)
  if (isMissingSongArtistsError(deleteResult.error)) return { data: [], error: null }
  if (deleteResult.error) return deleteResult
  if (!normalizedArtistIds.length) return { data: [], error: null }

  const insertResult = await supabase.from('song_artists').insert(normalizedArtistIds.map((artistId, index) => ({
    song_id: songId,
    artist_id: artistId,
    position: index + 1,
  })))
  if (isMissingSongArtistsError(insertResult.error)) return { data: [], error: null }
  return insertResult
}

export const listSongs = async ({ query = '', genreId = '', artistId = '' } = {}) => {
  let linkedSongIds = null

  if (artistId) {
    const linked = await supabase.from('song_artists').select('song_id').eq('artist_id', artistId)
    if (!linked.error) linkedSongIds = [...new Set((linked.data || []).map((item) => item.song_id))]
  }

  const { data, error } = await selectSongs((select) => {
    let request = supabase.from('songs').select(select).order('created_at', { ascending: false })
    if (query) request = request.ilike('title', `%${query}%`)
    if (genreId) request = request.eq('genre_id', genreId)
    if (artistId) request = linkedSongIds ? (linkedSongIds.length ? request.in('id', linkedSongIds) : request.eq('id', -1)) : request.eq('artist_id', artistId)
    return request
  })

  return { data: error ? null : await hydrateSongs(data), error }
}

export const getUserCommentGenreCounts = async (userId) => {
  if (!userId) return { data: [], error: null }

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('review_id')
    .eq('user_id', userId)
    .not('review_id', 'is', null)

  if (commentsError) return { data: [], error: commentsError }

  const reviewIds = [...new Set((comments || []).map((comment) => comment.review_id).filter(Boolean))]
  if (!reviewIds.length) return { data: [], error: null }

  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('id,song_id')
    .in('id', reviewIds)

  if (reviewsError) return { data: [], error: reviewsError }

  const songIds = [...new Set((reviews || []).map((review) => review.song_id).filter(Boolean))]
  if (!songIds.length) return { data: [], error: null }

  const { data: commentSongs, error: songsError } = await supabase
    .from('songs')
    .select('id,genre_id')
    .in('id', songIds)

  if (songsError) return { data: [], error: songsError }

  const reviewSongById = new Map((reviews || []).map((review) => [review.id, review.song_id]))
  const genreBySongId = new Map((commentSongs || []).map((song) => [song.id, song.genre_id]))
  const genreCounts = new Map()

  ;(comments || []).forEach((comment) => {
    const songId = reviewSongById.get(comment.review_id)
    const genreId = genreBySongId.get(songId)
    if (!genreId) return
    genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1)
  })

  return {
    data: [...genreCounts.entries()]
      .map(([genreId, count]) => ({ genreId, count }))
      .sort((left, right) => right.count - left.count),
    error: null,
  }
}

export const getSong = async (id) => {
  const { data, error } = await selectSongs((select) => supabase.from('songs').select(select).eq('id', id).single())
  if (error) return { data: null, error }
  return { data: (await hydrateSongs([data]))[0], error: null }
}

export const createSong = async ({ artist_ids = [], ...payload }) => {
  const normalizedArtistIds = normalizeArtistIds(artist_ids.length ? artist_ids : [payload.artist_id])
  const duplicate = await findDuplicateSong({ title: payload.title, artistIds: normalizedArtistIds })
  if (duplicate.error) return duplicate
  if (duplicate.data) return { data: null, error: new Error('이미 등록된 음악입니다. 기존 음악 페이지에서 리뷰를 작성해주세요.') }

  const { data, error } = await supabase.from('songs').insert({ ...payload, artist_id: normalizedArtistIds[0] || null }).select().single()
  if (error) return { data: null, error }

  const syncResult = await syncSongArtists(data.id, normalizedArtistIds)
  if (syncResult.error) return { data: null, error: syncResult.error }

  return getSong(data.id)
}

export const updateSong = async (id, { artist_ids = [], ...payload }) => {
  const normalizedArtistIds = normalizeArtistIds(artist_ids.length ? artist_ids : [payload.artist_id])
  const duplicate = await findDuplicateSong({ title: payload.title, artistIds: normalizedArtistIds, excludeId: id })
  if (duplicate.error) return duplicate
  if (duplicate.data) return { data: null, error: new Error('같은 제목과 가수로 등록된 음악이 이미 있습니다.') }

  const { error } = await supabase.from('songs').update({ ...payload, artist_id: normalizedArtistIds[0] || null }).eq('id', id).select().single()
  if (error) return { data: null, error }

  const syncResult = await syncSongArtists(id, normalizedArtistIds)
  if (syncResult.error) return { data: null, error: syncResult.error }

  return getSong(id)
}

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

export const searchArtists = async (query, { limit = 8 } = {}) => {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return { data: [], error: null }
  return supabase.from('artists').select('*').ilike('name', `%${normalizedQuery}%`).order('name').limit(limit)
}

export const listArtists = async () => supabase.from('artists').select('*').order('name')
export const findArtistByName = async (name) => supabase.from('artists').select('*').ilike('name', name.trim()).limit(1).maybeSingle()
export const getOrCreateArtist = async (name) => {
  const normalizedName = name.trim()
  if (!normalizedName) return { data: null, error: new Error('가수 이름을 입력해주세요.') }
  if (normalizedName.length > 80) return { data: null, error: new Error('가수 이름은 80자 이하로 입력해주세요.') }

  const existing = await findArtistByName(normalizedName)
  if (existing.error) return existing
  if (existing.data) return existing

  return supabase.from('artists').insert({ name: normalizedName }).select().single()
}
