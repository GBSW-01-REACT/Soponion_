import { cn } from '../../lib/utils'
export function Card({ className, ...props }) { return <section className={cn('surface', className)} {...props} /> }
