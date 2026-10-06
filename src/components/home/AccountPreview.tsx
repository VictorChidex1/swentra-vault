import { BalanceDisplay } from '@/components/banking/BalanceDisplay'
import type { CurrencyCode } from '@/components/banking/CurrencyBadge'
import { CurrencyBadge } from '@/components/banking/CurrencyBadge'
import { Reveal } from '@/components/common/Reveal'
import {
  TerminalFrame,
  TerminalHeader,
} from '@/components/terminal/TerminalFrame'
import { TerminalStatus } from '@/components/terminal/TerminalStatus'

interface DemoAccount {
  name: string
  currency: CurrencyCode
  amount: number
}

const ACCOUNTS: DemoAccount[] = [
  { name: 'CHF Primary', currency: 'CHF', amount: 184_220.0 },
  { name: 'USD Reserve', currency: 'USD', amount: 48_200.0 },
  { name: 'EUR Account', currency: 'EUR', amount: 31_420.9 },
  { name: 'NGN Account', currency: 'NGN', amount: 18_400_000.0 },
]

export function AccountPreview() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
      <Reveal>
        <TerminalFrame>
          <TerminalHeader
            title="Account overview"
            meta="Demonstration data"
          />
          <div className="p-6 sm:p-8">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Total balance
            </p>
            <p className="mt-2">
              <BalanceDisplay
                amount={284_590.42}
                currency="CHF"
                size="xl"
              />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Simulated consolidated value
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ACCOUNTS.map((account) => (
                <div
                  key={account.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2/50 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <CurrencyBadge currency={account.currency} />
                    <span className="text-sm text-muted-foreground">
                      {account.name}
                    </span>
                  </div>
                  <BalanceDisplay
                    amount={account.amount}
                    currency={account.currency}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5">
              <TerminalStatus label="Multi-currency accounts" />
              <TerminalStatus label="Clear transfer pricing" />
              <TerminalStatus label="Transaction PIN protection" />
            </div>
          </div>
        </TerminalFrame>
      </Reveal>
    </section>
  )
}
