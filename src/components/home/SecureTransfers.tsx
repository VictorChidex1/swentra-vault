import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

import { cn } from '@/lib/utils'
import { DecryptText } from '@/components/common/DecryptText'
import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import {
  TerminalFrame,
  TerminalHeader,
} from '@/components/terminal/TerminalFrame'
import { formatCurrency } from '@/lib/format'
import {
  fetchLatestChfRates,
  getFallbackChfRates,
} from '@/services/exchange-rates'

const STEPS = [
  'Choose the account you want to send from.',
  'Add the recipient, or pick someone you have saved.',
  'Enter the amount and see the exact cost before you commit.',
  'Review every detail — fee, rate and what the recipient receives.',
  'Confirm with your Transaction PIN.',
  'Keep a receipt for your records.',
]

export function SecureTransfers() {
  const [usdPerChf, setUsdPerChf] = useState<number | null>(null)
  const [rateStatus, setRateStatus] = useState<
    'loading' | 'live' | 'unavailable'
  >('loading')
  const [asOf, setAsOf] = useState<string | null>(null)

  // Track interactions and scroll state
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    let active = true
    fetchLatestChfRates()
      .then(({ rates, asOf }) => {
        if (!active) return
        setUsdPerChf(1 / rates.USD)
        setAsOf(asOf)
        setRateStatus('live')
      })
      .catch(() => {
        if (!active) return
        setRateStatus('unavailable')
      })
    return () => {
      active = false
    }
  }, [])

  const fallbackUsdPerChf = 1 / getFallbackChfRates().USD
  const rateValue =
    rateStatus === 'live' && usdPerChf !== null
      ? `1 CHF = ${usdPerChf.toFixed(4)} USD · live`
      : rateStatus === 'loading'
        ? 'Fetching live rate…'
        : `1 CHF = ${fallbackUsdPerChf.toFixed(4)} USD · rates unavailable`
  const recipientValue =
    rateStatus === 'live' && usdPerChf !== null
      ? formatCurrency(25_000 * usdPerChf, 'USD')
      : rateStatus === 'loading'
        ? '—'
        : formatCurrency(25_000 * fallbackUsdPerChf, 'USD')

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
            {STEPS.map((step, index) => {
              const isStepHovered = hoveredStep === index
              const isAnyHovered = hoveredStep !== null

              return (
                <li 
                  key={step} 
                  className={cn(
                    "flex gap-4 cursor-crosshair transition-all duration-300",
                    isAnyHovered && !isStepHovered ? "opacity-40" : "opacity-100"
                  )}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  <span className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors duration-300 text-xs",
                    isStepHovered ? "border-primary bg-primary/10 text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" : "border-border text-primary"
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={cn(
                    "text-sm leading-relaxed transition-colors duration-300",
                    isStepHovered ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step}
                  </span>
                </li>
              )
            })}
          </ol>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div
            onViewportEnter={() => setHasEntered(true)}
            viewport={{ once: true, margin: "-100px" }}
          >
            <TerminalFrame>
              <TerminalHeader title="Transfer review" meta="Demonstration data" />
              <div className="space-y-4 p-6 relative">
                <Row 
                  label="From" 
                  value="CHF Primary" 
                  isHovered={hoveredStep === 0}
                  isDimmed={hoveredStep !== null && hoveredStep !== 0}
                  hasEntered={hasEntered}
                  index={0}
                />
                <Row 
                  label="To" 
                  value="Example Recipient · Example Bank" 
                  isHovered={hoveredStep === 1}
                  isDimmed={hoveredStep !== null && hoveredStep !== 1}
                  hasEntered={hasEntered}
                  index={1}
                />
                <Row 
                  label="Transfer amount" 
                  value="CHF 25,000.00" 
                  isHovered={hoveredStep === 2}
                  isDimmed={hoveredStep !== null && hoveredStep !== 2}
                  hasEntered={hasEntered}
                  index={2}
                />
                <Row 
                  label="Transfer fee" 
                  value="CHF 150.00" 
                  isHovered={hoveredStep === 2}
                  isDimmed={hoveredStep !== null && hoveredStep !== 2}
                  hasEntered={hasEntered}
                  index={3}
                />
                <Row 
                  label="FX rate" 
                  value={rateValue} 
                  isHovered={hoveredStep === 3}
                  isDimmed={hoveredStep !== null && hoveredStep !== 3}
                  hasEntered={hasEntered}
                  index={4}
                />
                <Row 
                  label="Recipient receives" 
                  value={recipientValue} 
                  isHovered={hoveredStep === 3}
                  isDimmed={hoveredStep !== null && hoveredStep !== 3}
                  hasEntered={hasEntered}
                  index={5}
                />
                <div className="border-t border-border pt-4 transition-opacity duration-300">
                  <Row 
                    label="Total debit" 
                    value="CHF 25,150.00" 
                    strong 
                    isHovered={hoveredStep === 3}
                    isDimmed={hoveredStep !== null && hoveredStep !== 3}
                    hasEntered={hasEntered}
                    index={6}
                  />
                </div>
                <p className={cn(
                  "pt-2 text-xs transition-all duration-300",
                  hoveredStep === 4 ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" : (hoveredStep !== null ? "text-muted-foreground/30 blur-[1px]" : "text-muted-foreground")
                )}>
                  {hasEntered ? <DecryptText text="Confirmed with your Transaction PIN. You keep a receipt." delay={7 * 100} duration={600} /> : "Confirmed with your Transaction PIN. You keep a receipt."}
                </p>
                {rateStatus === 'live' && asOf ? (
                  <p className={cn(
                    "pt-1 text-xs transition-all duration-300",
                    hoveredStep === 5 ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" : (hoveredStep !== null ? "text-muted-foreground/30 blur-[1px]" : "text-muted-foreground")
                  )}>
                    {hasEntered ? <DecryptText text={`Live FX rate · as of ${asOf}`} delay={8 * 100} duration={600} /> : `Live FX rate · as of ${asOf}`}
                  </p>
                ) : null}
              </div>
            </TerminalFrame>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  strong = false,
  isHovered = false,
  isDimmed = false,
  hasEntered = false,
  index = 0,
}: {
  label: string
  value: string
  strong?: boolean
  isHovered?: boolean
  isDimmed?: boolean
  hasEntered?: boolean
  index?: number
}) {
  return (
    <div 
      className={cn(
        "flex items-baseline justify-between gap-4 transition-all duration-300 ease-out",
        isHovered ? "translate-x-1" : "translate-x-0",
        isDimmed ? "opacity-30 blur-[1px]" : "opacity-100"
      )}
    >
      <span className={cn(
        "text-xs tracking-wide uppercase transition-colors duration-300",
        isHovered ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" : "text-muted-foreground"
      )}>
        {label}
      </span>
      <span
        className={cn(
          "text-right tabular-nums transition-colors duration-300",
          strong ? "text-base font-semibold" : "text-sm",
          isHovered ? "text-foreground drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" : "text-foreground"
        )}
      >
        {hasEntered ? (
           <DecryptText text={value} delay={index * 100} duration={600} />
        ) : (
           value
        )}
      </span>
    </div>
  )
}
