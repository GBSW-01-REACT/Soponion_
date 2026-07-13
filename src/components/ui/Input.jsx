import { cn } from '../../lib/utils'

export function Input({ className, ...props }) {
  return <input className={cn('min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]', className)} {...props} />
}
