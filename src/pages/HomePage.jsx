import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Music2, Plus, Search, Settings2, Sparkles, Star } from 'lucide-react'
import { listSongs } from '../services/songs'
import { useAuth } from '../hooks/useAuth'
import { SongCard } from '../components/song/SongCard'

export function HomePage() {
  const { user, profile } = useAuth()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSongs().then(({ data }) => {
      setSongs(data || [])
      setLoading(false)
    })
  }, [])

  const featured = songs.slice(0, 6)
  const spotlight = featured[0]

  return <main className="page-shell py-5 sm:py-7">
    <section className="overflow-hidden rounded-3xl border border-[#2e3536] bg-[radial-gradient(circle_at_83%_5%,rgba(123,68,229,.3),transparent_28%),linear-gradient(135deg,#171b1c,#0d0f10_62%,#15111d)] text-white">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch lg:p-8">
        <div className="flex min-h-[250px] flex-col justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/15 px-3 py-1.5 text-[11px] font-bold tracking-[.13em] text-[#c9cfce]"><Sparkles size={14} className="text-[#a778ff]"/> TODAY ON SOPONION</p>
            <h1 className="mt-5 max-w-xl text-3xl font-extrabold leading-[1.12] tracking-[-0.07em] sm:text-5xl">좋아하는 음악을<br/>나만의 언어로 남기세요.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#b7c0c0]">별점과 리뷰, 대댓글로 오늘의 발견을 다른 사람과 편하게 나눌 수 있어요.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2"><Link to="/songs" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-[#0b0d0d] transition hover:bg-[#25e39a]"><Search size={17}/>음악 둘러보기</Link><Link to={user ? '/profile' : '/login'} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/15"><Settings2 size={17}/>{user ? '계정 설정' : '로그인하기'}</Link></div>
        </div>

        <aside className="rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between"><p className="text-xs font-bold tracking-[.14em] text-[#aeb4b5]">{user ? 'MY MUSIC SPACE' : 'START YOUR SPACE'}</p><span className="grid size-8 place-items-center rounded-xl bg-[#7d44e5]"><Music2 size={17}/></span></div>
          {user ? <><div className="mt-5 flex items-center gap-3"><span className="grid size-12 place-items-center overflow-hidden rounded-2xl bg-[#302046] text-lg font-extrabold">{profile?.profile_image_url ? <img className="size-full object-cover" src={profile.profile_image_url} alt=""/> : (profile?.nickname || '나').slice(0, 1)}</span><div><p className="font-extrabold">{profile?.nickname || '내 계정'}</p><p className="mt-1 text-xs text-[#aeb4b5]">프로필과 소개를 관리하세요</p></div></div><Link to="/profile" className="mt-5 flex min-h-11 items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 text-sm font-bold transition hover:bg-white/15"><span>계정 설정 열기</span><ArrowUpRight size={16}/></Link></> : <><p className="mt-5 text-xl font-extrabold tracking-[-.04em]">취향을 기록할<br/>나만의 공간을 만들어요.</p><p className="mt-3 text-sm leading-6 text-[#aeb4b5]">회원가입 후 음악 등록과 리뷰 작성에 참여할 수 있어요.</p><Link to="/signup" className="mt-5 flex min-h-11 items-center justify-between rounded-xl bg-[#25e39a] px-3 text-sm font-extrabold text-[#092116] transition hover:bg-[#6af0b8]"><span>회원가입</span><ArrowUpRight size={16}/></Link></>}
        </aside>
      </div>

      {spotlight && <Link to={`/songs/${spotlight.id}`} className="flex items-center gap-3 border-t border-white/10 bg-black/15 px-5 py-3 text-left transition hover:bg-black/25 sm:px-7"><span className="grid size-8 place-items-center rounded-lg bg-white/10"><Star size={15} className="fill-[#25e39a] text-[#25e39a]"/></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold tracking-[.13em] text-[#aeb4b5]">SPOTLIGHT</span><span className="block truncate text-sm font-bold">{spotlight.title} · {spotlight.artists?.name || '아티스트 미정'}</span></span><ArrowUpRight size={17} className="text-[#b7c0c0]"/></Link>}
    </section>

    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="eyebrow">EXPLORE MUSIC</p><h2 className="section-title mt-1">새로 등록된 음악</h2></div><Link className="inline-flex items-center gap-1 text-sm font-bold text-[var(--text-soft)] hover:text-[#0b9d65]" to="/songs">모두 보기 <ArrowUpRight size={16}/></Link></div>
      {loading ? <p className="muted py-10">음악을 불러오는 중입니다.</p> : featured.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{featured.map((song) => <SongCard key={song.id} song={song}/>)}</div> : <EmptyMusic/>}
    </section>

    <section className="mt-10 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
      <Link to="/songs" className="group relative min-h-52 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:bg-[var(--surface-hover)]">
        <p className="eyebrow">DISCOVER</p><h2 className="mt-3 max-w-sm text-2xl font-extrabold tracking-[-0.055em] text-[var(--text)]">제목, 장르, 아티스트로<br/>원하는 음악을 찾아보세요.</h2><span className="absolute bottom-5 right-5 grid size-11 place-items-center rounded-full bg-[var(--text)] text-[var(--surface)] transition group-hover:bg-[#0b9d65]"><Search size={20}/></span>
      </Link>
      <Link to="/songs/new" className="group relative min-h-52 overflow-hidden rounded-3xl border border-[#3b3152] bg-[radial-gradient(circle_at_80%_20%,rgba(134,76,255,.55),transparent_32%),#211c29] p-6 text-white transition hover:border-[#8066ae]">
        <p className="eyebrow text-[#c8b5ee]">CONTRIBUTE</p><h2 className="mt-3 max-w-sm text-2xl font-extrabold tracking-[-0.055em]">좋아하는 음악을<br/>새롭게 등록하세요.</h2><span className="absolute bottom-5 right-5 grid size-11 place-items-center rounded-full bg-white text-[#33234d] transition group-hover:bg-[#d3b6ff]"><Plus size={21}/></span>
      </Link>
    </section>
  </main>
}

function EmptyMusic() {
  return <div className="rounded-2xl border border-dashed border-[var(--border)] py-12 text-center"><Music2 className="mx-auto text-[var(--text-muted)]" size={32}/><p className="mt-3 font-bold">아직 등록된 음악이 없어요.</p><p className="mt-1 text-sm text-[var(--text-muted)]">첫 번째 음악을 등록해보세요.</p></div>
}
