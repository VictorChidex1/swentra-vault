import { useState, useRef } from 'react'
import type { MouseEvent } from 'react'
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'motion/react'

import { cn } from '@/lib/utils'
import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import { DecryptText } from '@/components/common/DecryptText'

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

function PricingCard({
  title,
  rows,
  delay = 0,
}: {
  title: string
  rows: { label: string; value: string }[]
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hasEntered, setHasEntered] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // 3D Tilt State
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth springs for the 3D tilt
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  // Transform coordinates into rotation angles
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"])

  // Spotlight State
  const spotlightX = useMotionValue(0)
  const spotlightY = useMotionValue(0)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    
    // For 3D Tilt (-0.5 to 0.5)
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    
    x.set(xPct)
    y.set(yPct)

    // For Spotlight (px coordinates)
    spotlightX.set(mouseX)
    spotlightY.set(mouseY)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <Reveal delay={delay}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onViewportEnter={() => setHasEntered(true)}
        viewport={{ once: true, margin: "-50px" }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative h-full rounded-xl border border-white/5 bg-surface p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10"
      >
        {/* Spotlight Glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                400px circle at ${spotlightX}px ${spotlightY}px,
                rgba(255, 255, 255, 0.04),
                transparent 80%
              )
            `,
          }}
        />

        <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-sm tracking-[0.15em] text-foreground uppercase">
            {hasEntered ? <DecryptText text={title} delay={100} duration={800} /> : title}
          </h3>
          <dl className="mt-6 divide-y divide-border">
            {rows.map((row, index) => {
              const isHovered = hoveredRow === index
              return (
                <div
                  key={row.label}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={cn(
                    "flex items-center justify-between py-3 transition-all duration-300 relative",
                    isHovered ? "bg-primary/5 px-4 -mx-4 rounded-md" : ""
                  )}
                >
                  <dt className={cn(
                    "text-sm transition-colors duration-300 font-mono flex items-center",
                    isHovered ? "text-primary" : "text-muted-foreground"
                  )}>
                    {isHovered && <span className="absolute left-2 text-primary/50">{">"}</span>}
                    {hasEntered ? <DecryptText text={row.label} delay={200 + index * 100} duration={600} /> : row.label}
                  </dt>
                  <dd className={cn(
                    "text-sm tabular-nums transition-all duration-300 font-mono flex items-center",
                    isHovered ? "text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.5)]" : "text-foreground"
                  )}>
                    {hasEntered ? <DecryptText text={row.value} delay={300 + index * 100} duration={600} /> : row.value}
                    {isHovered && <span className="absolute right-2 text-primary/50">{"<"}</span>}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      </motion.div>
    </Reveal>
  )
}

export function Pricing() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Clear transfer pricing"
          title="Always know the cost before you send."
          description="Fees are shown in your review before you confirm — never added afterwards. What you see is what leaves your account."
        />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2" style={{ perspective: "1500px" }}>
        <PricingCard 
          title="Domestic transfers · CHF" 
          rows={DOMESTIC.map(row => ({ label: row.band, value: row.fee }))}
          delay={0}
        />
        <PricingCard 
          title="International transfers" 
          rows={INTERNATIONAL}
          delay={0.1}
        />
      </div>
    </section>
  )
}
