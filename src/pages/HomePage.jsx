import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, Music2, Plus, Search, Star } from 'lucide-react'
import { getSongArtistNames, listSongs } from '../services/songs'
import { useAuth } from '../hooks/useAuth'
import { SongCard } from '../components/song/SongCard'

export function HomePage() {
  const { user, profile } = useAuth()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const carouselRef = useRef(null)
  const [carouselState, setCarouselState] = useState({ canPrev: false, canNext: false })

  useEffect(() => {
    listSongs().then(({ data }) => {
      setSongs(data || [])
      setLoading(false)
    })
  }, [])

  const featured = songs.slice(0, 12)
  const spotlight = featured[0]
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

  return <main className="page-shell pb-16 pt-8 sm:pt-14">
    <section className="border-y border-[var(--text)] py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
        <div>
          <p className="eyebrow text-[#6d7f70]">MUSIC NOTES · SOPONION</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.085em] text-[var(--text)] sm:text-6xl lg:text-7xl">음악을 듣고,<br/>생각을 나누는 곳.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--text-soft)]">새롭게 발견한 음악과 오래 기억하고 싶은 감상을 차분히 기록해보세요.</p>
        </div>

        <aside className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mx-auto flex max-w-[180px] justify-center">
            <img className="h-48 w-auto object-contain" src="/soponion-logo.png" alt="soponion 로고" width="180" height="246"/>
          </div>
          <div className="mt-5 border-t border-[var(--border)] pt-5">
            <p className="eyebrow text-[#6d7f70]">{user ? 'MY MUSIC NOTE' : 'SOPONION GUIDE'}</p>
            <h2 className="mt-3 text-xl font-extrabold leading-snug tracking-[-0.05em] text-[var(--text)]">{user ? `${profile?.nickname || '나'}님의 음악 기록` : '당신의 다음 음악을 찾아보세요.'}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{user ? '프로필과 내가 남긴 음악 감상을 이어서 관리할 수 있어요.' : '장르와 아티스트를 탐색하고, 다른 사람의 솔직한 한 줄 평을 읽어보세요.'}</p>
            <Link to={user ? '/profile' : '/songs'} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-extrabold text-[#f07822] transition hover:text-[#c95b12]">
              {user ? '계정 설정하기' : '음악 탐색하기'} <ArrowUpRight size={17}/>
            </Link>
          </div>
        </aside>
      </div>
    </section>

    <section className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_330px]">
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
            {featured.map((song) => <div key={song.id} className="w-[72vw] max-w-[320px] shrink-0 snap-start sm:w-[230px] lg:w-[210px] xl:w-[225px]"><SongCard song={song}/></div>)}
            <Link to="/songs" className="flex min-h-[330px] w-[72vw] max-w-[320px] shrink-0 snap-start flex-col justify-between rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[#f07822] hover:bg-[var(--surface-hover)] sm:w-[230px] lg:w-[210px] xl:w-[225px]">
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

function EmptyMusic() {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center"><Music2 className="mx-auto text-[var(--text-muted)]" size={32}/><p className="mt-3 font-bold">아직 등록된 음악이 없어요.</p><p className="mt-1 text-sm text-[var(--text-muted)]">첫 번째 음악을 등록해보세요.</p></div>
}
