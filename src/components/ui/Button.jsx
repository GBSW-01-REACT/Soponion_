import { cn } from '../../lib/utils'

export function Button({ className, variant = 'default', type = 'button', ...props }) {
  const styles = {
    default: 'border border-[#e7ece8] bg-[#f4f5f2] text-[#0a0b0b] hover:bg-[#25e39a] hover:border-[#25e39a]',
    outline: 'border border-[#454d4f] bg-[#1b1f20] text-[#f5f6f4] hover:bg-[#2b3031] hover:border-[#667071]',
    ghost: 'text-[#d7dddc] hover:bg-[#252a2b] hover:text-white',
    danger: 'border border-[#803e46] bg-[#4b2429] text-[#ffe8ea] hover:bg-[#673039]',
  }

  return <button type={type} className={cn('inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50', styles[variant], className)} {...props} />
}
