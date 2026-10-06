import { Fingerprint, KeyRound, Lock, ShieldCheck } from 'lucide-react'

import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'

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

export function Security() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
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
          <Reveal key={item.title} delay={index * 0.05}>
            <div className="h-full rounded-xl border border-border bg-surface p-5">
              <item.icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
