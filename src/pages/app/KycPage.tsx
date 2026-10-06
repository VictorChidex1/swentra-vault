import { Loader2Icon } from 'lucide-react'
import { useKyc } from '@/hooks/useKyc'
import { KycWizard } from '@/components/kyc/KycWizard'
import { KycStatusCard } from '@/components/kyc/KycStatusCard'

export default function KycPage() {
  const { record, status, loading } = useKyc()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin" />
          <p className="font-mono text-sm">Loading secure environment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-medium tracking-tight text-foreground">
          Identity Verification
        </h1>
        <p className="mt-2 text-muted-foreground">
          Secure identity management and compliance hub.
        </p>
      </div>

      {!status || status === 'PENDING' ? (
        <KycWizard />
      ) : (
        <div className="mx-auto max-w-xl">
          <KycStatusCard record={record!} />
          
          {(status === 'REJECTED' || status === 'MORE_INFORMATION_REQUIRED') && (
            <div className="mt-8 rounded-lg border border-border bg-card p-6 text-center shadow-sm">
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Update Required
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Your previous submission did not meet our verification criteria.
                Please submit a new application.
              </p>
              <div className="text-left">
                <KycWizard />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
