import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Reply, Trash2, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { createComment, deleteComment, listComments, updateComment } from '../../services/comments'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { useToast } from '../ui/Toast'

export function CommentList({ reviewId }) {
  const { user } = useAuth()
  const toast = useToast()
  const inputRef = useRef(null)
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    const { data, error } = await listComments(reviewId)
    if (error) return toast('댓글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.', 'error')
    setComments(data || [])
  }
  useEffect(() => { load() }, [reviewId])
  const startReply = (comment) => {
    setReplyTo(comment)
    setContent('')
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }
  const cancelReply = () => { setReplyTo(null); setContent('') }
  const submit = async (event) => {
    event.preventDefault()
    if (!user) return toast('댓글을 쓰려면 로그인해주세요.', 'error')
    if (!content.trim()) return toast('댓글 내용을 입력해주세요.', 'error')
    setSubmitting(true)
    const { error } = await createComment({ review_id: reviewId, user_id: user.id, parent_id: replyTo?.id || null, content: content.trim() })
    setSubmitting(false)
    if (error) return toast(error.message || '댓글을 저장하지 못했습니다.', 'error')
    toast(replyTo ? '대댓글을 등록했습니다.' : '댓글을 등록했습니다.')
    setContent('')
    setReplyTo(null)
    load()
  }
  const remove = async (id) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    const { error } = await deleteComment(id)
    if (error) return toast(error.message, 'error')
    if (replyTo?.id === id) cancelReply()
    toast('댓글을 삭제했습니다.')
    load()
  }
  const edit = async (comment) => {
    const next = window.prompt('댓글을 수정하세요.', comment.content)
    if (!next?.trim()) return
    const { error } = await updateComment(comment.id, next.trim())
    if (error) return toast(error.message, 'error')
    toast('댓글을 수정했습니다.')
    load()
  }
  const roots = comments.filter((comment) => !comment.parent_id)

  return <div className="mt-5 space-y-3 border-t pt-4"><div className="space-y-3">{roots.map((comment) => <div key={comment.id} className="space-y-2"><CommentItem comment={comment} own={comment.user_id === user?.id} onReply={() => startReply(comment)} onEdit={() => edit(comment)} onDelete={() => remove(comment.id)}/>{comments.filter((item) => item.parent_id === comment.id).map((reply) => <CommentItem key={reply.id} comment={reply} own={reply.user_id === user?.id} reply onEdit={() => edit(reply)} onDelete={() => remove(reply.id)}/>)}</div>)}</div><CommentComposer inputRef={inputRef} content={content} setContent={setContent} replyTo={replyTo} onCancel={cancelReply} onSubmit={submit} submitting={submitting}/></div>
}

function CommentComposer({ inputRef, content, setContent, replyTo, onCancel, onSubmit, submitting }) {
  const label = replyTo ? `${replyTo.profiles?.nickname || '사용자'}님에게 대댓글 작성` : '댓글 작성'
  return <form onSubmit={onSubmit} className={`border-t border-[#353d3f] pt-4 ${replyTo ? 'mt-2 rounded-xl bg-[#171b1c] px-3 pb-3' : ''}`}><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="comment-content" className="text-sm font-bold text-[#dce2e0]">{label}</label>{replyTo && <button type="button" onClick={onCancel} className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-[#aeb4b5] hover:text-white"><X size={15}/>답글 취소</button>}</div><div className="flex flex-col gap-2 sm:flex-row"><Textarea ref={inputRef} id="comment-content" value={content} onChange={(event) => setContent(event.target.value)} className="min-h-20 flex-1" placeholder={replyTo ? '답글을 입력하세요.' : '댓글을 입력하세요.'}/><Button type="submit" disabled={submitting} className="sm:self-end">{submitting ? '등록 중...' : replyTo ? '대댓글 등록' : '댓글 등록'}</Button></div></form>
}

function CommentItem({ comment, own, reply, onReply, onEdit, onDelete }) {
  return <article className={`border-b border-[#303637] py-3 text-sm ${reply ? 'ml-5 rounded-r-xl border-l-2 border-l-[#7d44e5] bg-[#171b1c] px-3' : ''}`}><div className="flex justify-between gap-2"><span className="font-bold text-[#f5f6f4]">{comment.profiles?.nickname || '사용자'}</span><div className="flex items-center gap-1">{!reply && <button type="button" aria-label="대댓글 작성" onClick={onReply} className="inline-flex min-h-9 items-center gap-1 px-1 text-xs font-bold text-[#aeb4b5] hover:text-white"><Reply size={15}/>답글</button>}{own && <><button type="button" aria-label="댓글 수정" onClick={onEdit} className="grid size-9 place-items-center text-[#aeb4b5] hover:text-white"><Pencil size={15}/></button><button type="button" aria-label="댓글 삭제" onClick={onDelete} className="grid size-9 place-items-center text-[#ec8b94] hover:text-[#ffc5ca]"><Trash2 size={15}/></button></>}</div></div><p className="mt-2 whitespace-pre-wrap leading-6 text-[#c1c8c7]">{comment.content}</p>{reply && <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.12em] text-[#a778ff]"><Check size={13}/>답글</p>}</article>
}
