import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Search, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { getOrCreateArtist, getSongArtists, listGenres, searchArtists } from '../../services/songs'

export function SongForm({ initial = {}, onSubmit, submitting }) {
  const initialArtists = useMemo(() => getSongArtists(initial), [initial])
  const [genres, setGenres] = useState([])
  const [selectedArtists, setSelectedArtists] = useState(initialArtists)
  const [artistResults, setArtistResults] = useState([])
  const [artistQuery, setArtistQuery] = useState('')
  const [artistError, setArtistError] = useState('')
  const [artistLoading, setArtistLoading] = useState(false)
  const [addingArtist, setAddingArtist] = useState(false)
  const [form, setForm] = useState({
    title: initial.title || '',
    genre_id: initial.genre_id || '',
    album_name: initial.album_name || '',
    album_image_url: initial.album_image_url || '',
    release_date: initial.release_date || '',
    youtube_url: initial.youtube_url || '',
  })

  useEffect(() => {
    listGenres({ ensureDefaults: true }).then((genreResult) => setGenres(genreResult.data || []))
  }, [])

  useEffect(() => {
    const query = artistQuery.trim()
    if (!query) {
      setArtistResults([])
      setArtistLoading(false)
      return undefined
    }

    setArtistLoading(true)
    const timer = window.setTimeout(async () => {
      const { data, error } = await searchArtists(query)
      setArtistLoading(false)
      if (error) {
        setArtistResults([])
        setArtistError('가수를 검색하지 못했습니다. 다시 시도해주세요.')
        return
      }
      setArtistResults(data || [])
    }, 250)

    return () => window.clearTimeout(timer)
  }, [artistQuery])

  const exactArtist = artistResults.find((artist) => artist.name.trim().toLocaleLowerCase() === artistQuery.trim().toLocaleLowerCase())
  const selectedIds = new Set(selectedArtists.map((artist) => String(artist.id)))
  const visibleResults = artistResults.filter((artist) => !selectedIds.has(String(artist.id)))
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  const selectArtist = (artist) => {
    if (!selectedIds.has(String(artist.id))) setSelectedArtists((current) => [...current, artist])
    setArtistQuery('')
    setArtistResults([])
    setArtistError('')
  }

  const removeArtist = (artistId) => {
    setSelectedArtists((current) => current.filter((artist) => String(artist.id) !== String(artistId)))
  }

  const clearArtistSearch = () => {
    setArtistQuery('')
    setArtistResults([])
    setArtistError('')
  }

  const addArtist = async () => {
    const name = artistQuery.trim()
    if (!name) return setArtistError('가수 이름을 입력해주세요.')

    setAddingArtist(true)
    const { data, error } = await getOrCreateArtist(name)
    setAddingArtist(false)

    if (error) return setArtistError(error.message || '가수를 추가하지 못했습니다. 다시 시도해주세요.')
    selectArtist(data)
  }

  const submit = async (event) => {
    event.preventDefault()
    let nextArtists = [...selectedArtists]

    if (artistQuery.trim()) {
      const { data, error } = await getOrCreateArtist(artistQuery)
      if (error) return setArtistError(error.message || '가수를 확인하지 못했습니다.')
      if (!nextArtists.some((artist) => String(artist.id) === String(data.id))) nextArtists = [...nextArtists, data]
    }

    if (!nextArtists.length) return setArtistError('가수를 검색해 선택하거나 새로 추가해주세요.')

    onSubmit({
      ...form,
      artist_id: nextArtists[0].id,
      artist_ids: nextArtists.map((artist) => artist.id),
    })
  }

  return <form onSubmit={submit} className="space-y-5">
    <label className="block text-sm font-semibold">
      음악 제목 <span className="text-[#ff8791]">*</span>
      <Input required name="title" value={form.title} onChange={change} placeholder="예: 밤편지" className="mt-2"/>
    </label>

    <div>
      <label htmlFor="artist-search" className="block text-sm font-semibold">가수 <span className="text-[#ff8791]">*</span></label>
      {selectedArtists.length > 0 && <div className="mt-2 flex flex-wrap gap-2">
        {selectedArtists.map((artist) => <span key={artist.id} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#3a4244] bg-[#252a2b] px-3 text-sm font-bold text-[#f5f6f4]">
          {artist.name}
          <button type="button" aria-label={`${artist.name} 선택 취소`} onClick={() => removeArtist(artist.id)} className="grid size-5 place-items-center rounded-full text-[#aeb4b5] hover:bg-[#3a4244] hover:text-white">
            <X size={13}/>
          </button>
        </span>)}
      </div>}

      <div className="relative mt-2">
        <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-[#8e9798]"/>
        <Input
          id="artist-search"
          value={artistQuery}
          onChange={(event) => { setArtistQuery(event.target.value); setArtistError('') }}
          placeholder="가수 이름을 입력해 검색하세요"
          autoComplete="off"
          role="combobox"
          aria-expanded={artistQuery.trim().length > 0}
          aria-controls="artist-results"
          className="pl-10 pr-10"
        />
        {artistQuery && <button type="button" aria-label="가수 검색어 지우기" onClick={clearArtistSearch} className="absolute right-1 top-0 grid size-11 place-items-center text-[#8e9798] hover:text-white">
          <X size={17}/>
        </button>}
      </div>

      <div id="artist-results" role="listbox" className="mt-2 overflow-hidden rounded-xl border border-[#3a4244] bg-[#171b1c]">
        {!artistQuery.trim() ? <p className="px-3 py-3 text-sm text-[#9aa0a1]">가수 이름을 입력하면 DB에서 검색합니다.</p>
          : artistLoading ? <p className="px-3 py-3 text-sm text-[#9aa0a1]">가수를 검색하는 중입니다.</p>
            : visibleResults.length ? visibleResults.map((artist) => <button type="button" role="option" aria-selected="false" key={artist.id} onClick={() => selectArtist(artist)} className="flex min-h-11 w-full items-center justify-between border-b border-[#303637] px-3 text-left text-sm last:border-0 hover:bg-[#282e2f]">
              <span>{artist.name}</span>
              <Check size={17} className="text-[#25e39a]"/>
            </button>)
              : <p className="px-3 py-3 text-sm text-[#9aa0a1]">일치하는 가수가 없습니다.</p>}
        {artistQuery.trim() && !exactArtist && <button type="button" onClick={addArtist} disabled={addingArtist} className="flex min-h-11 w-full items-center gap-2 border-t border-[#3a4244] bg-[#252a2b] px-3 text-left text-sm font-bold text-[#f5f6f4] hover:bg-[#303637] disabled:opacity-60">
          <Plus size={17}/>
          {addingArtist ? '가수를 추가하는 중...' : `“${artistQuery.trim()}” 가수 추가`}
        </button>}
      </div>
      {artistError && <p role="alert" className="mt-2 text-sm text-[#ff8791]">{artistError}</p>}
    </div>

    <label className="block text-sm font-semibold">
      장르
      <select name="genre_id" value={form.genre_id} onChange={change} className="mt-2 min-h-11 w-full rounded-xl border border-[#3a4244] bg-[#1b1f20] px-3 text-sm text-[#f5f6f4]">
        <option value="">장르를 선택하세요</option>
        {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
      </select>
    </label>

    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-semibold">앨범명<Input name="album_name" value={form.album_name} onChange={change} className="mt-2"/></label>
      <label className="block text-sm font-semibold">발매일<Input type="date" name="release_date" value={form.release_date || ''} onChange={change} className="mt-2"/></label>
    </div>
    <label className="block text-sm font-semibold">앨범 이미지 주소<Input type="url" name="album_image_url" value={form.album_image_url || ''} onChange={change} placeholder="https://" className="mt-2"/></label>
    <label className="block text-sm font-semibold">YouTube 주소<Input type="url" name="youtube_url" value={form.youtube_url || ''} onChange={change} placeholder="https://youtube.com/watch?v=..." className="mt-2"/></label>
    <Button type="submit" disabled={submitting || addingArtist} className="w-full">{submitting ? '저장 중...' : '저장하기'}</Button>
  </form>
}
