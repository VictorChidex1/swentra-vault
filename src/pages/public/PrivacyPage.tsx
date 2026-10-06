import { DocSection } from '@/components/common/DocSection'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">Privacy</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Your information, handled with care.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        This page explains, in plain terms, how the Swentra Vault prototype
        handles the information you provide.
      </p>

      <div className="mt-12 space-y-8">
        <DocSection title="What this covers">
          <p>
            This notice applies to the Swentra Vault demonstration and the
            information entered while exploring it. It is not a promise of
            regulated financial privacy rights — it is a description of this
            prototype.
          </p>
        </DocSection>

        <DocSection title="Information the demo handles">
          <p>
            Account details such as your name and email address; identity
            information and documents submitted as part of KYC; recipients on
            your transfers; and records of your activity within the
            demonstration.
          </p>
        </DocSection>

        <DocSection title="How it is used">
          <p>
            The information is used to demonstrate a realistic flow — creating
            an account, verifying identity, funding accounts, sending transfers
            and keeping receipts. It is not used for any real financial purpose.
          </p>
        </DocSection>

        <DocSection title="How it is protected">
          <p>
            Identity documents are stored privately and access is limited to the
            account owner and the people who perform the review. Your account is
            protected at sign-in, and transfers are confirmed with your
            Transaction PIN.
          </p>
        </DocSection>

        <DocSection title="What we do not do">
          <p>
            We do not sell your information. We do not share your information
            with third parties for marketing. We do not represent that your data
            is being handled by a regulated institution.
          </p>
        </DocSection>

        <DocSection title="Retention">
          <p>
            Demonstration data may be cleared or reset at any time as the
            prototype evolves. Do not rely on retained data in this environment.
          </p>
        </DocSection>

        <DocSection title="Your choices">
          <p>
            You choose what you enter. Where possible, use test or synthetic
            information, and avoid submitting real identity documents you are
            not comfortable storing in a prototype.
          </p>
        </DocSection>

        <DocSection title="Contact">
          <p>
            Questions about this notice can be raised through the support area
            of the product.
          </p>
        </DocSection>
      </div>
    </div>
  )
}