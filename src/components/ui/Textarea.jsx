import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('min-h-28 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]', className)} {...props} />
})
