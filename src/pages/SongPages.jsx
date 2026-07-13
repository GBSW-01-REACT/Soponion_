import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Music2, Pencil, PlusCircle, Star, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDebounce } from '../hooks/useDebounce'
import { createSong, deleteSong, getSong, listArtists, listGenres, listSongs, updateSong } from '../services/songs'
import { listReviews } from '../services/reviews'
import { getYoutubeEmbedUrl } from '../lib/utils'
import { SongCard } from '../components/song/SongCard'
import { SongForm } from '../components/song/SongForm'
import { ReviewCard } from '../components/review/ReviewCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

export function SongsPage() {
  const [songs, setSongs] = useState([])
  const [genres, setGenres] = useState([])
  const [artists, setArtists] = useState([])
  const [filters, setFilters] = useState({ query: '', genreId: '', artistId: '' })
  const query = useDebounce(filters.query)
  const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); const { data } = await listSongs({ ...filters, query }); setSongs(data || []); setLoading(false) }
  useEffect(() => { Promise.all([listGenres(), listArtists()]).then(([g, a]) => { setGenres(g.data || []); setArtists(a.data || []) }) }, [])
  useEffect(() => { load() }, [query, filters.genreId, filters.artistId])
  return <main className="page-shell py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-[#627565]">MUSIC LIBRARY</p><h1 className="section-title mt-1">음악 목록</h1></div><Link to="/songs/new"><Button><PlusCircle size={17} className="mr-1"/>음악 등록</Button></Link></div><div className="surface mt-6 grid gap-3 p-4 sm:grid-cols-3"><Input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="제목으로 검색"/><select aria-label="장르 필터" value={filters.genreId} onChange={(event) => setFilters({ ...filters, genreId: event.target.value })} className="min-h-11 rounded-md border border-[#babbb4] bg-white px-3 text-sm"><option value="">전체 장르</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}</select><select aria-label="아티스트 필터" value={filters.artistId} onChange={(event) => setFilters({ ...filters, artistId: event.target.value })} className="min-h-11 rounded-md border border-[#babbb4] bg-white px-3 text-sm"><option value="">전체 아티스트</option>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></div>{loading ? <p className="py-12 text-center text-[#6e746c]">음악을 불러오는 중입니다.</p> : songs.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{songs.map((song) => <SongCard key={song.id} song={song}/>)}</div> : <p className="surface mt-6 py-14 text-center text-[#6e746c]">조건에 맞는 음악이 없어요. 검색 조건을 바꿔보세요.</p>}</main>
}

export function SongDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    setLoadError(false)
    const [songResult, reviewResult] = await Promise.all([getSong(id), listReviews(id)])
    if (songResult.error) { setLoadError(true); toast('음악 정보를 불러오지 못했습니다.', 'error') } else setSong(songResult.data)
    if (reviewResult.error) { toast('리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'error'); setReviews([]) } else setReviews(reviewResult.data || [])
    if (!silent) setLoading(false)
  }
  useEffect(() => { load() }, [id])
  if (loading) return <main className="page-shell py-16 text-center text-[#6e746c]">음악 정보를 불러오는 중입니다.</main>
  if (loadError || !song) return <main className="page-shell py-16 text-center"><p className="font-bold">음악 정보를 불러오지 못했습니다.</p><Button className="mt-4" onClick={load}>다시 시도</Button></main>
  const own = song.created_by === user?.id
  const stat = song.song_rating_stats?.[0] || {}
  const video = getYoutubeEmbedUrl(song.youtube_url)
  const remove = async () => { if (!window.confirm('이 음악을 삭제할까요? 연결된 리뷰도 함께 삭제됩니다.')) return; const { error } = await deleteSong(id); if (error) return toast(error.message, 'error'); toast('음악을 삭제했습니다.'); navigate('/songs') }
  return <main className="page-shell py-7 sm:py-10"><nav aria-label="상세 경로" className="mb-5 flex items-center gap-1 text-sm text-[#6e746c]"><Link className="hover:text-[#20231f]" to="/songs">음악 목록</Link><ChevronRight size={15}/><span className="line-clamp-1 font-medium text-[#3b463c]">{song.title}</span></nav><div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start"><div className="order-2 min-w-0 space-y-10 lg:order-1"><section id="reviews" tabIndex="-1" className="scroll-mt-28"><div className="mb-4 flex items-end justify-between gap-3 border-b-2 border-[#20231f] pb-3"><div><p className="eyebrow">COMMUNITY REVIEW</p><h2 className="section-title mt-1">리뷰 {reviews.length}개</h2></div><Link to={`/songs/${id}/reviews/new`}><Button>리뷰 쓰기</Button></Link></div><div className="space-y-4">{reviews.length ? reviews.map((review) => <ReviewCard key={review.id} review={review} onChanged={() => load(true)}/>) : <div className="border-y border-[#dedcd6] py-12 text-center text-[#6e746c]">아직 리뷰가 없어요. 첫 감상을 남겨보세요.</div>}</div></section>{video && <section id="listen" tabIndex="-1" className="scroll-mt-28"><div className="mb-4 border-b border-[#dedcd6] pb-3"><p className="eyebrow">LISTEN</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.04em]">음악 듣기</h2></div><div className="aspect-video overflow-hidden rounded-md bg-[#20231f]"><iframe className="size-full" src={video} title={`${song.title} YouTube 영상`} loading="lazy" allowFullScreen/></div></section>}</div><aside className="order-1 lg:order-2 lg:sticky lg:top-24"><SongSummary song={song} stat={stat} reviewCount={reviews.length} own={own} onDelete={remove}/><SongSectionNav hasVideo={Boolean(video)} reviewCount={reviews.length}/></aside></div></main>
}

function SongSummary({ song, stat, reviewCount, own, onDelete }) {
  return <section className="surface overflow-hidden"><div className="aspect-[16/9] bg-[#e5ebe2] sm:aspect-square">{song.album_image_url ? <img className="size-full object-cover" src={song.album_image_url} alt={`${song.title} 앨범 표지`}/> : <div className="grid size-full place-items-center text-[#627565]"><Music2 size={48}/></div>}</div><div className="p-5"><p className="text-[11px] font-extrabold tracking-[0.16em] text-[#627565]">{song.genres?.name || '장르 미정'}</p><h1 className="mt-2 text-2xl font-extrabold tracking-[-0.055em]">{song.title}</h1><p className="mt-1 text-base text-[#6e746c]">{song.artists?.name || '아티스트 미정'}</p><p className="mt-5 flex items-center gap-2 border-y border-[#dedcd6] py-3 text-sm"><Star size={18} className="fill-[#c88753] text-[#c88753]"/><b>{Number(stat.avg_rating || 0).toFixed(1)}</b><span className="text-[#6e746c]">리뷰 {reviewCount}개</span></p><div className="mt-4 flex flex-wrap gap-2"><Link to={`/songs/${song.id}/reviews/new`}><Button>리뷰 쓰기</Button></Link>{own && <><Link to={`/songs/${song.id}/edit`}><Button variant="outline"><Pencil size={16} className="mr-1"/>수정</Button></Link><Button variant="danger" onClick={onDelete}><Trash2 size={16} className="mr-1"/>삭제</Button></>}</div></div></section>
}

function SongSectionNav({ hasVideo, reviewCount }) {
  return <nav aria-label="음악 상세 바로가기" className="mt-4 flex border-y border-[#dedcd6] bg-[#f7f5f1] text-sm font-bold"><a className="flex min-h-11 flex-1 items-center justify-center text-[#3b463c] hover:bg-[#eef1ea]" href="#reviews">리뷰 {reviewCount}</a>{hasVideo && <a className="flex min-h-11 flex-1 items-center justify-center border-l border-[#dedcd6] text-[#3b463c] hover:bg-[#eef1ea]" href="#listen">음악 듣기</a>}</nav>
}

export function SongEditorPage({ edit = false }) {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (edit) getSong(id).then(({ data, error }) => { if (error) toast('음악 정보를 불러오지 못했습니다.', 'error'); else setSong(data) }) }, [edit, id])
  if (edit && !song) return <main className="page-shell py-16 text-center text-[#6e746c]">불러오는 중입니다.</main>
  const submit = async (form) => { setBusy(true); const payload = { ...form, artist_id: form.artist_id || null, genre_id: form.genre_id || null, release_date: form.release_date || null, created_by: user.id }; const { data, error } = edit ? await updateSong(id, payload) : await createSong(payload); setBusy(false); if (error) return toast(error.message, 'error'); toast(edit ? '음악 정보를 수정했습니다.' : '음악을 등록했습니다.'); navigate(`/songs/${data.id || id}`) }
  return <main className="page-shell max-w-2xl py-10"><h1 className="section-title">{edit ? '음악 수정' : '음악 등록'}</h1><p className="mt-2 text-sm text-[#6e746c]">정확한 정보를 입력하면 다른 사람이 음악을 더 쉽게 찾을 수 있어요.</p><div className="surface mt-6 p-5 sm:p-7"><SongForm initial={song || {}} onSubmit={submit} submitting={busy}/></div></main>
}
