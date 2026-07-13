import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, Clock3, Music2, Plus, Search, Star } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSongArtistNames, getUserCommentGenreCounts, listSongs } from '../services/songs'
import { SongCard } from '../components/song/SongCard'

const getSongStat = (song) => {
  const stat = song.song_rating_stats?.[0] || {}
  return {
    score: Number(stat.avg_rating || 0),
    reviewCount: Number(stat.review_count || 0),
  }
}

const getDateTime = (value) => {
  const time = new Date(value || 0).getTime()
  return Number.isFinite(time) ? time : 0
}

const getReleaseTime = (song) => getDateTime(song.release_date) || getDateTime(song.created_at)

export function HomePage() {
  const { user } = useAuth()
  const [songs, setSongs] = useState([])
  const [genrePreferences, setGenrePreferences] = useState([])
  const [loading, setLoading] = useState(true)
  const carouselRef = useRef(null)
  const [carouselState, setCarouselState] = useState({ canPrev: false, canNext: false })

  useEffect(() => {
    let cancelled = false

    const loadHome = async () => {
      setLoading(true)
      const [songResult, preferenceResult] = await Promise.all([
        listSongs(),
        user ? getUserCommentGenreCounts(user.id) : Promise.resolve({ data: [], error: null }),
      ])

      if (cancelled) return
      setSongs(songResult.data || [])
      setGenrePreferences(preferenceResult.error ? [] : preferenceResult.data || [])
      setLoading(false)
    }

    loadHome()
    return () => { cancelled = true }
  }, [user?.id])

  const featured = songs.slice(0, 12)
  const genreWeightById = new Map(genrePreferences.map(({ genreId, count }) => [genreId, count]))
  const hasGenrePreferences = genreWeightById.size > 0
  const recommendedSongs = [...songs]
    .sort((a, b) => {
      const genreDifference = (genreWeightById.get(b.genre_id) || 0) - (genreWeightById.get(a.genre_id) || 0)
      if (genreDifference) return genreDifference
      const left = getSongStat(a)
      const right = getSongStat(b)
      if (right.score !== left.score) return right.score - left.score
      if (right.reviewCount !== left.reviewCount) return right.reviewCount - left.reviewCount
      return getReleaseTime(b) - getReleaseTime(a)
    })
    .slice(0, 4)
  const latestSongs = [...songs].sort((a, b) => getReleaseTime(b) - getReleaseTime(a)).slice(0, 4)
  const spotlight = recommendedSongs[0] || featured[0]
  const updateCarouselState = () => {
    const carousel = carouselRef.current
    if (!carousel) return
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth
    const edgeOffset = 20
    setCarouselState({
      canPrev: carousel.scrollLeft > edgeOffset,
      canNext: carousel.scrollLeft < maxScrollLeft - edgeOffset,
    })
  }

  useEffect(() => {
    updateCarouselState()
  }, [songs, loading])

  useEffect(() => {
    window.addEventListener('resize', updateCarouselState)
    return () => window.removeEventListener('resize', updateCarouselState)
  }, [])

  const moveCarousel = (direction) => {
    const carousel = carouselRef.current
    if (!carousel) return
    const distance = Math.max(carousel.clientWidth * 0.78, 260)
    carousel.scrollBy({ left: direction * distance, behavior: 'smooth' })
    window.setTimeout(updateCarouselState, 320)
  }

  return <main className="page-shell overflow-x-hidden pb-12 pt-5 sm:pt-10">
    <section className="border-y border-[var(--border)] py-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-[#6d7f70]">PERSONAL MUSIC MIX</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.065em] text-[var(--text)] sm:text-4xl">추천과 최신 음악</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">댓글로 남긴 취향과 발매일을 기준으로 골라드려요.</p>
        </div>
        <Link className="inline-flex min-h-11 w-fit items-center gap-1 rounded-xl border border-[var(--border)] px-4 text-sm font-extrabold text-[var(--text)] transition hover:border-[#f07822] hover:text-[#f07822]" to="/songs">음악 전체 보기 <ArrowUpRight size={16}/></Link>
      </div>

      {loading ? <p className="muted py-14 text-center">음악을 불러오는 중입니다.</p> : songs.length ? <div className="mt-5 grid gap-3 lg:grid-cols-2 lg:gap-4">
        <MusicShowcase title={hasGenrePreferences ? '취향 추천 음악' : '추천 음악'} eyebrow={hasGenrePreferences ? 'BASED ON YOUR COMMENTS' : 'TOP RATED'} description={hasGenrePreferences ? '댓글을 많이 남긴 장르를 먼저 보여드려요.' : '댓글 취향이 쌓이면 더 맞춤으로 추천해드려요.'} icon={<Star size={18} className="fill-current"/>} songs={recommendedSongs} emptyText="아직 추천할 음악이 없어요."/>
        <MusicShowcase title="최신 음악" eyebrow="NEW RELEASES" description="발매일이 가장 최근인 순서예요." icon={<Clock3 size={18}/>} songs={latestSongs} emptyText="아직 최신 음악이 없어요."/>
      </div> : <EmptyMusic/>}
    </section>

    <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-10 lg:py-10">
      <div>
        <div className="mb-5 flex items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <p className="eyebrow text-[#6d7f70]">NEW RELEASES</p>
            <h2 className="section-title mt-1">새로 등록된 음악</h2>
          </div>
          <Link className="inline-flex items-center gap-1 text-sm font-bold text-[var(--text-soft)] hover:text-[#f07822]" to="/songs">전체 보기 <ArrowUpRight size={16}/></Link>
        </div>

        {loading ? <p className="muted py-16 text-center">음악을 불러오는 중입니다.</p> : featured.length ? <div className="relative">
          <button type="button" aria-label="이전 음악 보기" disabled={!carouselState.canPrev} onClick={() => moveCarousel(-1)} className="absolute left-2 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]/95 text-[var(--text)] shadow-lg backdrop-blur transition hover:bg-[var(--surface-hover)] disabled:pointer-events-none disabled:opacity-0">
            <ChevronLeft size={22}/>
          </button>
          <div ref={carouselRef} onScroll={updateCarouselState} aria-label="새로 등록된 음악 가로 목록" className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {featured.map((song) => <div key={song.id} className="w-[68vw] max-w-[280px] shrink-0 snap-start sm:w-[230px] lg:w-[210px] xl:w-[225px]"><SongCard song={song}/></div>)}
            <Link to="/songs" className="flex min-h-[300px] w-[68vw] max-w-[280px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[#f07822] hover:bg-[var(--surface-hover)] sm:w-[230px] lg:w-[210px] xl:w-[225px]">
              <span>
                <span className="eyebrow text-[#6d7f70]">MORE MUSIC</span>
                <span className="mt-3 block text-2xl font-extrabold leading-tight tracking-[-0.055em] text-[var(--text)]">더 많은 음악을<br/>둘러보세요.</span>
              </span>
              <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f07822] px-4 text-sm font-extrabold text-white">전체 보기 <ArrowUpRight size={17}/></span>
            </Link>
          </div>
          <button type="button" aria-label="다음 음악 보기" disabled={!carouselState.canNext} onClick={() => moveCarousel(1)} className="absolute right-2 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)]/95 text-[var(--text)] shadow-lg backdrop-blur transition hover:bg-[var(--surface-hover)] disabled:pointer-events-none disabled:opacity-0">
            <ChevronRight size={22}/>
          </button>
        </div> : <EmptyMusic/>}
      </div>

      <aside className="space-y-4">
        <Link to="/songs" className="group flex min-h-14 items-center justify-between border-y border-[var(--border)] py-4 text-sm font-extrabold text-[var(--text)] transition hover:text-[#f07822]">
          <span className="inline-flex items-center gap-2"><Search size={18}/>음악 탐색하기</span>
          <ArrowUpRight size={17} className="transition group-hover:translate-x-0.5"/>
        </Link>

        {spotlight && <Link to={`/songs/${spotlight.id}`} className="block border-y border-[var(--border)] py-6 transition hover:border-[#f07822]">
          <p className="eyebrow text-[#6d7f70]">TODAY SPOTLIGHT</p>
          <div className="mt-4 flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0e5] text-[#f07822]"><Star size={18} className="fill-current"/></span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold tracking-[-0.04em] text-[var(--text)]">{spotlight.title}</p>
              <p className="mt-1 truncate text-sm text-[var(--text-soft)]">{getSongArtistNames(spotlight)}</p>
            </div>
          </div>
        </Link>}

        <Link to="/songs/new" className="group relative block overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:bg-[var(--surface-hover)]">
          <p className="eyebrow text-[#6d7f70]">CONTRIBUTE</p>
          <h2 className="mt-3 max-w-sm text-2xl font-extrabold tracking-[-0.055em] text-[var(--text)]">좋아하는 음악을<br/>새롭게 등록하세요.</h2>
          <span className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f07822] px-4 text-sm font-extrabold text-white transition group-hover:bg-[#d76517]"><Plus size={18}/>음악 등록</span>
        </Link>
      </aside>
    </section>
  </main>
}

function MusicShowcase({ title, eyebrow, description, icon, songs, emptyText }) {
  const mainSong = songs[0]
  const subSongs = songs.slice(1, 4)

  return <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
      <div>
        <p className="eyebrow text-[#6d7f70]">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-extrabold tracking-[-0.055em] text-[var(--text)] sm:text-2xl">{title}</h2>
        <p className="mt-1 text-xs text-[var(--text-soft)]">{description}</p>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff0e5] text-[#f07822]">{icon}</span>
    </div>

    {mainSong ? <div className="mt-4 space-y-3">
      <FeaturedMusicLink song={mainSong}/>
      {subSongs.length ? <div className="grid gap-2">{subSongs.map((song) => <CompactMusicLink key={song.id} song={song}/>)}</div> : null}
    </div> : <p className="muted py-10 text-center">{emptyText}</p>}
  </section>
}

function FeaturedMusicLink({ song }) {
  const { score, reviewCount } = getSongStat(song)

  return <Link to={`/songs/${song.id}`} className="group grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 transition hover:border-[#f07822] hover:bg-[var(--surface-hover)] sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
    <div className="aspect-square overflow-hidden rounded-xl bg-[#282e2f]">
      {song.album_image_url ? <img src={song.album_image_url} alt={`${song.title} 앨범 표지`} className="size-full object-cover transition duration-300 group-hover:scale-[1.035]" loading="lazy"/> : <div className="grid size-full place-items-center text-[#8e9798]"><Music2 size={36}/></div>}
    </div>
    <div className="flex min-w-0 flex-col justify-between">
      <div>
        <p className="eyebrow text-[#6d7f70]">{song.genres?.name || '장르 미정'}</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight tracking-[-0.06em] text-[var(--text)] sm:mt-2 sm:text-2xl">{song.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-[var(--text-soft)] sm:mt-2">{getSongArtistNames(song)}</p>
      </div>
      <p className="mt-2 flex items-center gap-1 text-sm font-bold text-[var(--text)] sm:mt-4"><Star size={16} className="fill-[#25e39a] text-[#25e39a]"/>{score.toFixed(1)}<span className="text-[var(--text-muted)]">리뷰 {reviewCount}</span></p>
    </div>
  </Link>
}

function CompactMusicLink({ song }) {
  const { score, reviewCount } = getSongStat(song)

  return <Link to={`/songs/${song.id}`} className="group flex min-h-20 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 transition hover:border-[#f07822] hover:bg-[var(--surface-hover)]">
    <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-[#282e2f]">
      {song.album_image_url ? <img src={song.album_image_url} alt={`${song.title} 앨범 표지`} className="size-full object-cover transition duration-300 group-hover:scale-[1.035]" loading="lazy"/> : <div className="grid size-full place-items-center text-[#8e9798]"><Music2 size={24}/></div>}
    </div>
    <div className="min-w-0 flex-1">
      <p className="line-clamp-1 text-sm font-extrabold tracking-[-0.035em] text-[var(--text)]">{song.title}</p>
      <p className="mt-1 line-clamp-1 text-xs text-[var(--text-soft)]">{getSongArtistNames(song)}</p>
      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-[var(--text)]"><Star size={13} className="fill-[#25e39a] text-[#25e39a]"/>{score.toFixed(1)}<span className="text-[var(--text-muted)]">리뷰 {reviewCount}</span></p>
    </div>
    <ArrowUpRight size={17} className="shrink-0 text-[var(--text-muted)] transition group-hover:text-[#f07822]"/>
  </Link>
}

function EmptyMusic() {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center"><Music2 className="mx-auto text-[var(--text-muted)]" size={32}/><p className="mt-3 font-bold">아직 등록된 음악이 없어요.</p><p className="mt-1 text-sm text-[var(--text-muted)]">첫 번째 음악을 등록해보세요.</p></div>
}
