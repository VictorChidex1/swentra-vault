import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import {
  TerminalFrame,
  TerminalHeader,
} from '@/components/terminal/TerminalFrame'

const STEPS = [
  'Choose the account you want to send from.',
  'Add the recipient, or pick someone you have saved.',
  'Enter the amount and see the exact cost before you commit.',
  'Review every detail — fee, rate and what the recipient receives.',
  'Confirm with your Transaction PIN.',
  'Keep a receipt for your records.',
]

export function SecureTransfers() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            eyebrow="Secure transfers"
            title="A transfer you can follow from start to finish."
            description="Nothing happens behind your back. You choose the account, the recipient and the amount — and you confirm the final numbers yourself."
          />

          <ol className="mt-8 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-xs text-primary">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.1}>
          <TerminalFrame>
            <TerminalHeader title="Transfer review" meta="Demonstration data" />
            <div className="space-y-4 p-6">
              <Row label="From" value="CHF Primary" />
              <Row label="To" value="Example Recipient · Example Bank" />
              <Row label="Transfer amount" value="CHF 25,000.00" />
              <Row label="Transfer fee" value="CHF 150.00" />
              <Row label="FX rate" value="1 CHF = 1.24 USD (simulated)" />
              <Row label="Recipient receives" value="USD 30,380.00" />
              <div className="border-t border-border pt-4">
                <Row label="Total debit" value="CHF 25,150.00" strong />
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                Confirmed with your Transaction PIN. You keep a receipt.
              </p>
            </div>
          </TerminalFrame>
        </Reveal>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={
          strong
            ? 'text-right text-base font-semibold text-foreground tabular-nums'
            : 'text-right text-sm text-foreground tabular-nums'
        }
      >
        {value}
      </span>
    </div>
  )
}
