import { useState, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Fingerprint, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { motion, useMotionValue, useMotionTemplate } from 'motion/react'

import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'
import { DecryptText } from '@/components/common/DecryptText'

const PROTECTIONS = [
  {
    icon: Lock,
    title: 'Protected sign-in',
    body: 'Your account is accessed with your own credentials, and your identity is confirmed before you can transact.',
  },
  {
    icon: KeyRound,
    title: 'Transaction PIN',
    body: 'Every transfer is confirmed with your personal 6-digit Transaction PIN — separate from your sign-in password.',
  },
  {
    icon: Fingerprint,
    title: 'Verified identity (KYC)',
    body: 'We review the identity you submit so that your account stays yours, in line with how modern banking works.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by default',
    body: 'Your documents are kept private and only ever shared with the people who need them. You can review your activity at any time.',
  },
]

function SecurityCard({
  item,
  index,
}: {
  item: typeof PROTECTIONS[0]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovered, setIsHovered] = useState(false)
  const [scanKey, setScanKey] = useState(0)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const { left, top } = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - left)
    mouseY.set(e.clientY - top)
  }

  function handleMouseEnter() {
    setIsHovered(true)
    setScanKey((prev) => prev + 1)
  }

  return (
    <Reveal delay={index * 0.05}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative h-full overflow-hidden rounded-xl border border-white/5 bg-surface p-5 transition-colors duration-300 hover:border-primary/30"
      >
        {/* 1. Biometric Blacklight Pattern */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0, 255, 102, 0.15) 1px, transparent 0)`,
            backgroundSize: `12px 12px`,
            maskImage: useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
            WebkitMaskImage: useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
          }}
        />

        {/* 2. Soft Cursor Glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                200px circle at ${mouseX}px ${mouseY}px,
                rgba(0, 255, 102, 0.04),
                transparent 100%
              )
            `,
          }}
        />

        {/* 3. The Laser Scanner */}
        {isHovered && (
          <motion.div
            key={scanKey}
            initial={{ top: "-10%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="pointer-events-none absolute left-0 right-0 z-20 h-[1px] bg-primary shadow-[0_0_20px_2px_rgba(0,255,102,0.8)]"
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:shadow-[0_0_15px_rgba(0,255,102,0.15)]">
            <item.icon className="size-5 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            <DecryptText key={scanKey} text={item.title} delay={0} duration={600} />
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/80">
            {item.body}
          </p>
        </div>
      </motion.div>
    </Reveal>
  )
}

export function Security() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Your security"
          title="Built around your control."
          description="Straightforward protections that keep your account and your money yours — explained in plain terms."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROTECTIONS.map((item, index) => (
          <SecurityCard key={item.title} item={item} index={index} />
        ))}
      </div>
    </section>
  )
}
