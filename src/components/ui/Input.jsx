import { cn } from '../../lib/utils'

export function Input({ className, ...props }) {
  return <input className={cn('min-h-11 w-full rounded-xl border border-[#3a4244] bg-[#1b1f20] px-3 text-sm text-[#f5f6f4] placeholder:text-[#7f8788]', className)} {...props} />
}
