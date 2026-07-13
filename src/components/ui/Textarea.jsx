import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('min-h-28 w-full rounded-xl border border-[#3a4244] bg-[#1b1f20] px-3 py-2 text-sm text-[#f5f6f4] placeholder:text-[#7f8788]', className)} {...props} />
})
