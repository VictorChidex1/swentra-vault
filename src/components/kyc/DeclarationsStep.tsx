import type { Declarations } from '@/types/kyc'

interface DeclarationsStepProps {
  data: Partial<Declarations>
  onChange: (data: Partial<Declarations>) => void
}

export function DeclarationsStep({ data, onChange }: DeclarationsStepProps) {
  function update(field: keyof Declarations, value: boolean) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Stage 04 / 04
        </p>
        <h2 className="mt-2 text-xl font-medium text-foreground">
          Legal Declarations
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review and accept the following declarations to finalize your
          identity verification request.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
            checked={data.informationAccurate ?? false}
            onChange={(e) => update('informationAccurate', e.target.checked)}
            required
          />
          <div className="space-y-1 leading-none">
            <span className="text-sm font-medium text-foreground">
              Information Accuracy
            </span>
            <p className="text-xs text-muted-foreground">
              I declare that all information provided in this application is true,
              accurate, and complete to the best of my knowledge.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
            checked={data.actingOnOwnBehalf ?? false}
            onChange={(e) => update('actingOnOwnBehalf', e.target.checked)}
            required
          />
          <div className="space-y-1 leading-none">
            <span className="text-sm font-medium text-foreground">
              Acting on Own Behalf
            </span>
            <p className="text-xs text-muted-foreground">
              I confirm that I am opening this account for myself and acting on my
              own behalf, not on behalf of any third party.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
            checked={data.acceptsTerms ?? false}
            onChange={(e) => update('acceptsTerms', e.target.checked)}
            required
          />
          <div className="space-y-1 leading-none">
            <span className="text-sm font-medium text-foreground">
              Terms & Conditions
            </span>
            <p className="text-xs text-muted-foreground">
              I have read, understood, and accept the Swentra Vault Terms of
              Service, Privacy Policy, and fee schedule.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
            checked={data.pepDeclaration === false}
            onChange={(e) =>
              update('pepDeclaration', !e.target.checked)
            }
            required
          />
          <div className="space-y-1 leading-none">
            <span className="text-sm font-medium text-foreground">
              PEP Declaration
            </span>
            <p className="text-xs text-muted-foreground">
              I declare that I am not a Politically Exposed Person (PEP), nor a
              family member or close associate of a PEP.
            </p>
          </div>
        </label>
      </div>
    </div>
  )
}
