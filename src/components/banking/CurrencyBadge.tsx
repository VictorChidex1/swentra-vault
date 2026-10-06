import { cn } from '@/lib/utils'

export type CurrencyCode = 'CHF' | 'USD' | 'EUR' | 'NGN'

interface CurrencyBadgeProps {
  currency: CurrencyCode
  className?: string
}

export function CurrencyBadge({ currency, className }: CurrencyBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs tracking-wider text-muted-foreground',
        className,
      )}
    >
      {currency}
    </span>
  )
}
