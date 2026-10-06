import { Link } from 'react-router-dom'

import { DocSection } from '@/components/common/DocSection'
import { Button } from '@/components/ui/button'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">About</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        A calmer way to hold and move money.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Swentra Vault is a banking technology prototype built to show how a
        modern, multi-currency account could feel: clear, calm and fully in your
        control.
      </p>

      <div className="mt-12 space-y-8">
        <DocSection title="What Swentra Vault is">
          <p>
            Swentra Vault demonstrates a private-banking experience: separate
            currency accounts, transfers with upfront pricing, identity
            verification (KYC), a Transaction PIN for confirming payments, and
            receipts you can keep.
          </p>
          <p>
            It is a simulated environment created for demonstration. It is not a
            licensed bank and does not provide regulated financial services.
          </p>
        </DocSection>

        <DocSection title="Our approach">
          <p>
            <span className="text-foreground">Transparency.</span> See every fee
            and every rate before you confirm — never afterwards.
          </p>
          <p>
            <span className="text-foreground">Control.</span> You choose the
            account, the recipient and the amount, and you authorise each
            transfer with your Transaction PIN.
          </p>
          <p>
            <span className="text-foreground">Clarity.</span> Plain language and
            structured information, so you always know what is happening with
            your money.
          </p>
        </DocSection>

        <DocSection title="Multi-currency, done simply">
          <p>
            Instead of a single balance you toggle between currencies, Swentra
            Vault gives each currency its own account — CHF, USD, EUR and NGN —
            so you always see exactly what you hold.
          </p>
        </DocSection>

        <DocSection title="Built around your security">
          <p>
            Your account is protected at sign-in, transfers are confirmed with
            your personal Transaction PIN, your identity is verified before you
            transact, and your documents are kept private. You can review your
            activity at any time.
          </p>
        </DocSection>

        <DocSection title="An honest prototype">
          <p>
            Everything you see is a demonstration. Balances, transfers, KYC
            reviews and settlement are simulated and do not represent real
            banking activity. We would rather show you a realistic product than
            make claims that are not true.
          </p>
        </DocSection>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/register">Open an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/security">See how we protect you</Link>
        </Button>
      </div>
    </div>
  )
}
