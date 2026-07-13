import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { getOrCreateArtist, listArtists, listGenres } from '../../services/songs'

export function SongForm({ initial = {}, onSubmit, submitting }) {
  const [genres, setGenres] = useState([])
  const [artists, setArtists] = useState([])
  const [artistQuery, setArtistQuery] = useState(initial.artists?.name || '')
  const [artistError, setArtistError] = useState('')
  const [artistLoading, setArtistLoading] = useState(true)
  const [addingArtist, setAddingArtist] = useState(false)
  const [form, setForm] = useState({ title: initial.title || '', artist_id: initial.artist_id || '', genre_id: initial.genre_id || '', album_name: initial.album_name || '', album_image_url: initial.album_image_url || '', release_date: initial.release_date || '', youtube_url: initial.youtube_url || '' })

  useEffect(() => {
    Promise.all([listGenres(), listArtists()]).then(([genreResult, artistResult]) => {
      setGenres(genreResult.data || [])
      setArtists(artistResult.data || [])
      setArtistLoading(false)
      if (artistResult.error) setArtistError('아티스트 목록을 불러오지 못했습니다. 다시 시도해주세요.')
    })
  }, [])

  const filteredArtists = useMemo(() => {
    const query = artistQuery.trim().toLocaleLowerCase()
    if (!query) return artists.slice(0, 6)
    return artists.filter((artist) => artist.name.toLocaleLowerCase().includes(query)).slice(0, 6)
  }, [artistQuery, artists])
  const exactArtist = artists.find((artist) => artist.name.trim().toLocaleLowerCase() === artistQuery.trim().toLocaleLowerCase())
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const selectArtist = (artist) => { setForm({ ...form, artist_id: artist.id }); setArtistQuery(artist.name); setArtistError('') }
  const clearArtist = () => { setForm({ ...form, artist_id: '' }); setArtistQuery(''); setArtistError('') }
  const addArtist = async () => {
    const name = artistQuery.trim()
    if (!name) return setArtistError('아티스트 이름을 입력해주세요.')
    setAddingArtist(true)
    const { data, error } = await getOrCreateArtist(name)
    setAddingArtist(false)
    if (error) return setArtistError(error.message || '아티스트를 추가하지 못했습니다. 다시 시도해주세요.')
    setArtists((current) => current.some((artist) => artist.id === data.id) ? current : [...current, data].sort((a, b) => a.name.localeCompare(b.name, 'ko')))
    selectArtist(data)
  }
  const submit = async (event) => {
    event.preventDefault()
    let artistId = form.artist_id
    if (!artistId && artistQuery.trim()) {
      const { data, error } = await getOrCreateArtist(artistQuery)
      if (error) return setArtistError(error.message || '아티스트를 확인하지 못했습니다.')
      setArtists((current) => current.some((artist) => artist.id === data.id) ? current : [...current, data])
      artistId = data.id
    }
    if (!artistId) return setArtistError('아티스트를 검색해 선택하거나 새로 추가해주세요.')
    onSubmit({ ...form, artist_id: artistId })
  }

  return <form onSubmit={submit} className="space-y-5"><label className="block text-sm font-semibold">음악 제목 <span className="text-[#ff8791]">*</span><Input required name="title" value={form.title} onChange={change} placeholder="예: 밤편지" className="mt-2"/></label><div><label htmlFor="artist-search" className="block text-sm font-semibold">아티스트 <span className="text-[#ff8791]">*</span></label><div className="relative mt-2"><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-[#8e9798]"/><Input id="artist-search" required value={artistQuery} onChange={(event) => { setArtistQuery(event.target.value); setForm({ ...form, artist_id: '' }); setArtistError('') }} placeholder="아티스트 이름을 검색하세요" autoComplete="off" role="combobox" aria-expanded={!artistLoading && artistQuery.length > 0} aria-controls="artist-results" className="pl-10 pr-10"/>{(artistQuery || form.artist_id) && <button type="button" aria-label="아티스트 선택 지우기" onClick={clearArtist} className="absolute right-1 top-0 grid size-11 place-items-center text-[#8e9798] hover:text-white"><X size={17}/></button>}</div><div id="artist-results" role="listbox" className="mt-2 overflow-hidden rounded-xl border border-[#3a4244] bg-[#171b1c]">{artistLoading ? <p className="px-3 py-3 text-sm text-[#9aa0a1]">아티스트 목록을 불러오는 중입니다.</p> : filteredArtists.length ? filteredArtists.map((artist) => <button type="button" role="option" aria-selected={String(form.artist_id) === String(artist.id)} key={artist.id} onClick={() => selectArtist(artist)} className="flex min-h-11 w-full items-center justify-between border-b border-[#303637] px-3 text-left text-sm last:border-0 hover:bg-[#282e2f]"><span>{artist.name}</span>{String(form.artist_id) === String(artist.id) && <Check size={17} className="text-[#25e39a]"/>}</button>) : <p className="px-3 py-3 text-sm text-[#9aa0a1]">일치하는 아티스트가 없습니다.</p>}{artistQuery.trim() && !exactArtist && <button type="button" onClick={addArtist} disabled={addingArtist} className="flex min-h-11 w-full items-center gap-2 border-t border-[#3a4244] bg-[#252a2b] px-3 text-left text-sm font-bold text-[#f5f6f4] hover:bg-[#303637] disabled:opacity-60"><Plus size={17}/>{addingArtist ? '아티스트를 추가하는 중...' : `“${artistQuery.trim()}” 아티스트 추가`}</button>}</div>{form.artist_id && <p className="mt-2 text-xs font-medium text-[#25e39a]">선택된 아티스트: {artistQuery}</p>}{artistError && <p role="alert" className="mt-2 text-sm text-[#ff8791]">{artistError}</p>}</div><label className="block text-sm font-semibold">장르<select name="genre_id" value={form.genre_id} onChange={change} className="mt-2 min-h-11 w-full rounded-xl border border-[#3a4244] bg-[#1b1f20] px-3 text-sm text-[#f5f6f4]"><option value="">장르를 선택하세요</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select></label><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold">앨범명<Input name="album_name" value={form.album_name} onChange={change} className="mt-2"/></label><label className="block text-sm font-semibold">발매일<Input type="date" name="release_date" value={form.release_date || ''} onChange={change} className="mt-2"/></label></div><label className="block text-sm font-semibold">앨범 이미지 주소<Input type="url" name="album_image_url" value={form.album_image_url || ''} onChange={change} placeholder="https://" className="mt-2"/></label><label className="block text-sm font-semibold">YouTube 주소<Input type="url" name="youtube_url" value={form.youtube_url || ''} onChange={change} placeholder="https://youtube.com/watch?v=..." className="mt-2"/></label><Button type="submit" disabled={submitting || addingArtist} className="w-full">{submitting ? '저장 중...' : '저장하기'}</Button></form>
}
