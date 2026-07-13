import { cn } from '../../lib/utils'
export function Input({ className, ...props }) { return <input className={cn('min-h-11 w-full rounded-md border border-[#babbb4] bg-white px-3 text-sm placeholder:text-[#8a8f88]', className)} {...props} /> }
