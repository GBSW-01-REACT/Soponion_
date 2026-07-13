import { cn } from '../../lib/utils'
export function Textarea({ className, ...props }) { return <textarea className={cn('min-h-28 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400', className)} {...props} /> }
