import { cn } from '../../lib/utils'

export function Button({ className, variant = 'default', type = 'button', ...props }) {
  const styles = {
    default: 'border border-[var(--text)] bg-[var(--text)] text-[var(--surface)] hover:bg-[#0b9d65] hover:border-[#0b9d65]',
    outline: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)]',
    ghost: 'text-[var(--text-soft)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
    danger: 'border border-[#803e46] bg-[#4b2429] text-[#ffe8ea] hover:bg-[#673039]',
  }

  return <button type={type} className={cn('inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50', styles[variant], className)} {...props} />
}
