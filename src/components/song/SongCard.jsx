import { Link } from 'react-router-dom'
import { Music2, Star } from 'lucide-react'
import { Card } from '../ui/Card'

export function SongCard({ song }) {
  const stat = song.song_rating_stats?.[0] || {}
  const score = Number(stat.avg_rating || 0).toFixed(1)

  return <Link to={`/songs/${song.id}`} className="block h-full">
    <Card className="group h-full overflow-hidden border-[#303637] bg-[#1a1e1f] transition hover:-translate-y-0.5 hover:border-[#596264] hover:bg-[#222728]">
      <div className="relative aspect-square overflow-hidden bg-[#282e2f]">
        {song.album_image_url ? <img src={song.album_image_url} alt={`${song.title} 앨범 표지`} className="size-full object-cover transition duration-300 group-hover:scale-[1.035]" loading="lazy"/> : <div className="grid size-full place-items-center text-[#8e9798]"><Music2 size={38}/></div>}
        <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border-[3px] border-[#25e39a] bg-[#101313]/85 text-xs font-extrabold text-[#25e39a]">{score}</span>
      </div>
      <div className="p-3.5">
        <p className="text-[10px] font-bold tracking-[0.14em] text-[#8e9798]">{song.genres?.name || '장르 미정'}</p>
        <h3 className="mt-1 line-clamp-1 text-[15px] font-extrabold tracking-[-0.035em] text-[#f5f6f4]">{song.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-[#aeb4b5]">{song.artists?.name || '아티스트 미정'}</p>
        <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#d7dddc]"><Star size={14} className="fill-[#25e39a] text-[#25e39a]"/>리뷰 {stat.review_count || 0}</p>
      </div>
    </Card>
  </Link>
}
