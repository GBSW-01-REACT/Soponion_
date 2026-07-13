import { forwardRef } from 'react'
import { cn } from '../../lib/utils'
export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) { return <textarea ref={ref} className={cn('min-h-28 w-full rounded-md border border-[#babbb4] bg-white px-3 py-2 text-sm placeholder:text-[#8a8f88]', className)} {...props} /> })
