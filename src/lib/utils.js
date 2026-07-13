import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs) => twMerge(clsx(inputs))
export const formatDate = (value) => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value)) : ''
export const getYoutubeEmbedUrl = (url) => { try { const parsed = new URL(url); const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop(); return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null } catch { return null } }
