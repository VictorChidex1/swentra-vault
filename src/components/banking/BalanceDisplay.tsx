import type { CurrencyCode } from '@/components/banking/CurrencyBadge'
import { cn } from '@/lib/utils'

function formatAmount(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface BalanceDisplayProps {
  amount: number
  currency: CurrencyCode
  size?: 'lg' | 'xl'
  className?: string
}

export function BalanceDisplay({
  amount,
  currency,
  size = 'lg',
  className,
}: BalanceDisplayProps) {
  return (
    <span
      className={cn(
        'tabular-nums tracking-tight text-foreground',
        size === 'xl' ? 'text-3xl sm:text-4xl' : 'text-xl',
        className,
      )}
    >
      {formatAmount(amount, currency)}
    </span>
  )
}
