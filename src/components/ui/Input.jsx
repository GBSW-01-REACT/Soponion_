import { cn } from '../../lib/utils'
export function Input({ className, ...props }) { return <input className={cn('min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm placeholder:text-slate-400', className)} {...props} /> }
