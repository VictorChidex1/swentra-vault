import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'

const DOMESTIC = [
  { band: 'CHF 0 – 5,000', fee: 'CHF 35' },
  { band: 'CHF 5,001 – 25,000', fee: 'CHF 75' },
  { band: 'CHF 25,001 – 100,000', fee: 'CHF 150' },
  { band: 'CHF 100,001 and above', fee: '0.20%' },
]

const INTERNATIONAL = [
  { label: 'Base processing fee', value: 'CHF 150' },
  { label: 'Transfer fee', value: '0.35%' },
  { label: 'FX spread', value: '0.20%' },
]

export function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Clear transfer pricing"
          title="Always know the cost before you send."
          description="Fees are shown in your review before you confirm — never added afterwards. What you see is what leaves your account."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm tracking-[0.15em] text-foreground uppercase">
              Domestic transfers · CHF
            </h3>
            <dl className="mt-6 divide-y divide-border">
              {DOMESTIC.map((row) => (
                <div
                  key={row.band}
                  className="flex items-center justify-between py-3"
                >
                  <dt className="text-sm text-muted-foreground">{row.band}</dt>
                  <dd className="text-sm text-foreground tabular-nums">
                    {row.fee}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="h-full rounded-xl border border-border bg-surface p-6">
            <h3 className="text-sm tracking-[0.15em] text-foreground uppercase">
              International transfers
            </h3>
            <dl className="mt-6 divide-y divide-border">
              {INTERNATIONAL.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-3"
                >
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm text-foreground tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Prototype pricing for a simulated environment. These are illustrative
        figures, not the pricing of any real bank.
      </p>
    </section>
  )
}
