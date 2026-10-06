import { Reveal } from '@/components/common/Reveal'
import { SectionHeading } from '@/components/common/SectionHeading'

const STEPS = [
  {
    title: 'Open an account',
    body: 'Create your account and confirm your email address.',
  },
  {
    title: 'Verify your identity',
    body: 'Complete KYC by sharing your details and identity document.',
  },
  {
    title: 'Fund your accounts',
    body: 'Hold CHF, USD, EUR and NGN in separate currency accounts.',
  },
  {
    title: 'Send and keep a receipt',
    body: 'Transfer with a clear quote, confirm with your Transaction PIN, and keep the receipt.',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="How Swentra works"
          title="Four steps from sign-up to your first transfer."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.05}>
            <div className="h-full rounded-xl border border-border bg-surface p-5">
              <span className="text-xs tracking-[0.2em] text-primary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
