import { useState } from 'react'
import { cn } from '../../lib/utils'

const sizeClasses = {
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-24 text-2xl',
}

export function Avatar({ name = '사용자', src, size = 'md', className, imageClassName }) {
  const [failed, setFailed] = useState(false)
  const label = name.trim() || '사용자'
  const showImage = Boolean(src) && !failed

  return <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#7d44e5] font-extrabold text-white', sizeClasses[size], className)} aria-label={`${label} 프로필 이미지`}>
    {showImage ? <img className={cn('size-full object-cover', imageClassName)} src={src} alt={`${label} 프로필 이미지`} onError={() => setFailed(true)}/> : label.slice(0, 1)}
  </span>
}
