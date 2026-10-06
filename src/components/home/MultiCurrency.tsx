import { BalanceDisplay } from '@/components/banking/BalanceDisplay'
import type { CurrencyCode } from '@/components/banking/CurrencyBadge'
import { CurrencyBadge } from '@/components/banking/CurrencyBadge'
import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'

interface CurrencyAccount {
  name: string
  currency: CurrencyCode
  amount: number
  blurb: string
}

const CURRENCIES: CurrencyAccount[] = [
  {
    name: 'Swiss Franc',
    currency: 'CHF',
    amount: 184_220.0,
    blurb: 'Your primary account for day-to-day banking.',
  },
  {
    name: 'US Dollar',
    currency: 'USD',
    amount: 48_200.0,
    blurb: 'A reserve account for dollar holdings.',
  },
  {
    name: 'Euro',
    currency: 'EUR',
    amount: 31_420.9,
    blurb: 'Hold and send euros without conversion.',
  },
  {
    name: 'Nigerian Naira',
    currency: 'NGN',
    amount: 18_400_000.0,
    blurb: 'Send home with clear, upfront pricing.',
  },
]

export function MultiCurrency() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Multi-currency banking"
          title="Every currency has its own account."
          description="Hold CHF, USD, EUR and NGN side by side. No toggle, no guesswork, no hidden conversions — each account shows exactly what it holds."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CURRENCIES.map((account, index) => (
          <Reveal key={account.currency} delay={index * 0.05}>
            <div className="flex h-full flex-col justify-between rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <CurrencyBadge currency={account.currency} />
                <span className="text-xs text-muted-foreground">
                  {account.name}
                </span>
              </div>
              <p className="mt-6">
                <BalanceDisplay
                  amount={account.amount}
                  currency={account.currency}
                />
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {account.blurb}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Balances shown are demonstration values for a simulated environment.
      </p>
    </section>
  )
}
