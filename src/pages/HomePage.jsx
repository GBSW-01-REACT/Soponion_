import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Heart, MessageCircle, Music2, Plus, Search, Sparkles } from 'lucide-react'
import { listSongs } from '../services/songs'
import { SongCard } from '../components/song/SongCard'

export function HomePage() {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSongs().then(({ data }) => {
      setSongs(data || [])
      setLoading(false)
    })
  }, [])

  const featured = songs.slice(0, 6)

  return <main className="page-shell py-5 sm:py-7">
    <section className="overflow-hidden rounded-3xl border border-[#2e3536] bg-[radial-gradient(circle_at_82%_20%,rgba(92,71,127,0.3),transparent_27%),linear-gradient(135deg,#1b2021,#111415_65%,#17131d)] px-5 py-7 sm:px-8 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#42494a] bg-black/20 px-3 py-1.5 text-xs font-bold text-[#d8dddd]"><Sparkles size={14} className="text-[#a778ff]"/> MUSIC REVIEW COMMUNITY</div>
          <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.06] tracking-[-0.075em] text-white sm:text-6xl">음악을 듣고,<br/>점수와 감상을 남기세요.</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#b7c0c0] sm:text-base">Soponion은 음악을 발견하고 별점, 리뷰, 대댓글로 취향을 함께 나누는 음악 커뮤니티입니다.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link to="/songs" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f4f5f2] px-4 text-sm font-extrabold text-[#0a0b0b] transition hover:bg-[#25e39a]"><Search size={17}/>음악 탐색</Link>
            <Link to="/songs/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#4b5456] bg-[#202526] px-4 text-sm font-extrabold text-white transition hover:bg-[#2c3233]"><Plus size={17}/>음악 등록</Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[440px] rounded-[2rem] border border-[#4b5354] bg-[#0c0f10] p-3 shadow-2xl shadow-black/40 lg:mb-[-4.5rem]">
          <div className="rounded-[1.45rem] bg-[#f0f0ec] p-4 text-[#161918]">
            <div className="flex items-center justify-between"><span className="font-extrabold tracking-[-0.05em]">soponion</span><span className="grid size-7 place-items-center rounded-full bg-[#141617] text-xs text-white">◌</span></div>
            <div className="mt-4 flex rounded-full bg-[#dbddda] p-1 text-center text-[11px] font-bold"><span className="flex-1 rounded-full bg-[#252a2a] px-2 py-1.5 text-white">탐색</span><span className="flex-1 px-2 py-1.5 text-[#707776]">리뷰</span><span className="flex-1 px-2 py-1.5 text-[#707776]">나</span></div>
            <div className="mt-4 rounded-2xl bg-[#161919] p-3 text-white">
              <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#7d44e5]"><Music2 size={19}/></div><div><p className="text-[10px] font-bold text-[#9fa8a7]">오늘의 음악</p><p className="text-sm font-extrabold">취향을 기록하는 순간</p></div><span className="ml-auto score-ring size-10 border-[3px] text-[11px]">4.5</span></div>
              <div className="mt-3 flex gap-1.5 text-[#c4ccca]"><Heart size={15}/><MessageCircle size={15}/><span className="ml-auto text-[10px] font-bold text-[#8e9798]">리뷰 작성</span></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">{[0, 1, 2].map((index) => <div key={index} className="aspect-[.78] overflow-hidden rounded-xl bg-[#c7cdca]">{featured[index]?.album_image_url ? <img className="size-full object-cover" src={featured[index].album_image_url} alt=""/> : <div className="grid size-full place-items-center text-[#6b7371]"><Music2 size={18}/></div>}</div>)}</div>
          </div>
        </div>
      </div>
    </section>

    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3"><div><p className="eyebrow">EXPLORE MUSIC</p><h2 className="section-title mt-1">새로 등록된 음악</h2></div><Link className="inline-flex items-center gap-1 text-sm font-bold text-[#dce2e0] hover:text-[#25e39a]" to="/songs">모두 보기 <ArrowUpRight size={16}/></Link></div>
      {loading ? <p className="muted py-10">음악을 불러오는 중입니다.</p> : featured.length ? <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">{featured.map((song) => <SongCard key={song.id} song={song}/>)}</div> : <EmptyMusic/>}
    </section>

    <section className="mt-10 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
      <Link to="/songs" className="group relative min-h-52 overflow-hidden rounded-3xl border border-[#303637] bg-[#1b1f20] p-6 transition hover:border-[#5b6466]">
        <p className="eyebrow">DISCOVER</p><h2 className="mt-3 max-w-sm text-2xl font-extrabold tracking-[-0.055em]">제목, 장르, 아티스트로<br/>원하는 음악을 찾아보세요.</h2><span className="absolute bottom-5 right-5 grid size-11 place-items-center rounded-full bg-[#f1f3ef] text-[#121514] transition group-hover:bg-[#25e39a]"><Search size={20}/></span>
      </Link>
      <Link to="/songs/new" className="group relative min-h-52 overflow-hidden rounded-3xl border border-[#3b3152] bg-[radial-gradient(circle_at_80%_20%,rgba(134,76,255,.55),transparent_32%),#211c29] p-6 transition hover:border-[#8066ae]">
        <p className="eyebrow text-[#c8b5ee]">CONTRIBUTE</p><h2 className="mt-3 max-w-sm text-2xl font-extrabold tracking-[-0.055em]">좋아하는 음악을<br/>새롭게 등록하세요.</h2><span className="absolute bottom-5 right-5 grid size-11 place-items-center rounded-full bg-white text-[#33234d] transition group-hover:bg-[#d3b6ff]"><Plus size={21}/></span>
      </Link>
    </section>
  </main>
}

function EmptyMusic() {
  return <div className="rounded-2xl border border-dashed border-[#3a4244] py-12 text-center"><Music2 className="mx-auto text-[#8e9798]" size={32}/><p className="mt-3 font-bold">아직 등록된 음악이 없어요.</p><p className="mt-1 text-sm text-[#9aa0a1]">첫 번째 음악을 등록해보세요.</p></div>
}
