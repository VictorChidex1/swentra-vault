import { DocSection } from '@/components/common/DocSection'

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">Terms</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Using Swentra Vault, simply explained.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        These terms describe a demonstration product, not a contract for banking
        services.
      </p>

      <div className="mt-12 space-y-8">
        <DocSection title="A prototype, not a bank">
          <p>
            Swentra Vault is a simulated banking environment built to
            demonstrate product concepts. It is not a licensed bank and does not
            provide regulated financial services, custody, or real-money
            transfers.
          </p>
        </DocSection>

        <DocSection title="No real money">
          <p>
            Balances, transfers, fees, FX rates and KYC reviews shown in this
            demonstration are simulated. None of them move or represent real
            funds.
          </p>
        </DocSection>

        <DocSection title="Your information in the demo">
          <p>
            You may enter personal details, including identity documents, as
            part of the demonstration flow. Use test or synthetic information
            where you can; never share real sensitive documents you are not
            comfortable storing in a prototype.
          </p>
        </DocSection>

        <DocSection title="Acceptable use">
          <p>
            Use the demonstration for its intended purpose: exploring how the
            product works. Do not attempt to disrupt it, bypass its protections,
            or represent it as a real financial service.
          </p>
        </DocSection>

        <DocSection title="No warranty">
          <p>
            The demonstration is provided as-is for illustrative purposes, with
            no guarantee about availability, accuracy of figures, or fitness for
            any real financial purpose.
          </p>
        </DocSection>

        <DocSection title="Changes">
          <p>
            Swentra Vault is under active development. Features, pricing
            illustrations and behaviour can change without notice.
          </p>
        </DocSection>

        <DocSection title="Contact">
          <p>
            Questions about this demonstration can be raised through the support
            area of the product.
          </p>
        </DocSection>
      </div>
    </div>
  )
}