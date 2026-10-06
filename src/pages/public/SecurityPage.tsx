import { Fingerprint, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

const CONTROLS = [
  {
    icon: Lock,
    title: 'Protected sign-in',
    body: 'Your account is protected by your own credentials, tied to your verified identity.',
  },
  {
    icon: KeyRound,
    title: 'Transaction PIN',
    body: 'Transfers are confirmed with your personal 6-digit Transaction PIN, kept separate from your sign-in password.',
  },
  {
    icon: Fingerprint,
    title: 'Identity verification (KYC)',
    body: 'Your identity is reviewed before you can transact, in line with how modern banking works.',
  },
  {
    icon: ShieldCheck,
    title: 'Private document storage',
    body: 'Identity documents are stored privately and only shared with the people who need them for review.',
  },
  {
    title: 'Activity you can review',
    body: 'Your accounts, transfers and receipts are available for you to check at any time.',
  },
  {
    title: 'Accounts you control',
    body: 'You decide when to send, how much to send and where it goes.',
  },
]

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">Security</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Protections you can actually count on.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        No fluff, no jargon. These are the protections built into Swentra
        Vault, explained in plain terms.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {CONTROLS.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border bg-surface p-5"
          >
            {item.icon ? (
              <item.icon className="size-5 text-primary" aria-hidden="true" />
            ) : (
              <span className="mt-0.5 block size-5" aria-hidden="true" />
            )}
            <h2 className="mt-4 text-sm font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-surface-2/50 p-6">
        <p className="text-xs tracking-[0.2em] text-warning uppercase">
          An honest note
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Swentra Vault is a prototype. These protections describe a product in
          development — not a guarantee, a certification, or a regulated
          financial promise. We will never claim security we have not built.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/register">Open an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/about">Learn more about Swentra Vault</Link>
        </Button>
      </div>
    </div>
  )
}