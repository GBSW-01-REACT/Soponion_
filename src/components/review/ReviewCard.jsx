import { Heart, MessageCircle, Pencil, Star, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { deleteReview } from '../../services/reviews'
import { toggleLike } from '../../services/likes'
import { formatDate } from '../../lib/utils'
import { CommentList } from '../comment/CommentList'
import { useToast } from '../ui/Toast'

export function ReviewCard({ review, onChanged }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const liked = review.review_likes?.some((like) => like.user_id === user?.id)
  const likes = review.review_likes?.length || 0
  const own = review.user_id === user?.id
  const remove = async () => { if (!window.confirm('이 리뷰를 삭제할까요? 댓글과 좋아요도 함께 삭제됩니다.')) return; const { error } = await deleteReview(review.id); if (error) return toast(error.message, 'error'); toast('리뷰를 삭제했습니다.'); onChanged() }
  const like = async () => { if (!user) return navigate('/login'); const { error } = await toggleLike(review.id, user.id, liked); if (error) toast(error.message, 'error'); else onChanged() }

  return <article className="surface overflow-hidden p-4 sm:p-5">
    <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#7d44e5] text-xs font-extrabold">{(review.profiles?.nickname || '사').slice(0, 1)}</span><div><Link to={`/profile/${review.user_id}`} className="font-bold text-[#f5f6f4] hover:text-[#25e39a]">{review.profiles?.nickname || '알 수 없는 사용자'}</Link><p className="mt-1 flex items-center gap-2 text-xs text-[#8e9798]"><span className="inline-flex items-center gap-1 font-bold text-[#dce2e0]"><Star size={14} className="fill-[#25e39a] text-[#25e39a]"/>{Number(review.rating).toFixed(1)}</span>{formatDate(review.created_at)}</p></div></div>{own && <div className="flex gap-1"><Link aria-label="리뷰 수정" className="grid size-9 place-items-center rounded-lg text-[#aeb4b5] hover:bg-[#2b3031] hover:text-white" to={`/reviews/${review.id}/edit`}><Pencil size={16}/></Link><button aria-label="리뷰 삭제" onClick={remove} className="grid size-9 place-items-center rounded-lg text-[#ec8b94] hover:bg-[#402126] hover:text-[#ffc5ca]"><Trash2 size={16}/></button></div>}</div>
    <h3 className="mt-4 font-extrabold tracking-[-0.025em] text-[#f5f6f4]">{review.title}</h3>
    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#c1c8c7]">{review.content}</p>
    <div className="mt-4 flex items-center gap-2 border-t border-[#353d3f] pt-3"><button onClick={like} className={`inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-bold ${liked ? 'text-[#ff8791]' : 'text-[#aeb4b5] hover:bg-[#2b3031] hover:text-white'}`}><Heart size={17} className={liked ? 'fill-[#ff6875]' : ''}/>좋아요 {likes}</button><span className="inline-flex items-center gap-1 text-sm text-[#8e9798]"><MessageCircle size={16}/>댓글</span></div>
    <CommentList reviewId={review.id}/>
  </article>
}
