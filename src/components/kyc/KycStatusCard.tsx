import { ShieldAlertIcon, ShieldCheckIcon, ClockIcon, InfoIcon } from 'lucide-react'
import type { KycRecord, KycStatus } from '@/types/kyc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KycStatusCardProps {
  record: KycRecord
}

export function KycStatusCard({ record }: KycStatusCardProps) {
  const { status, rejectionReason } = record

  const config: Record<
    KycStatus,
    { title: string; desc: string; icon: any; colorClass: string; bgClass: string }
  > = {
    PENDING: {
      title: 'Verification Pending',
      desc: 'Your application has not been submitted yet.',
      icon: InfoIcon,
      colorClass: 'text-muted-foreground',
      bgClass: 'bg-surface',
    },
    UNDER_REVIEW: {
      title: 'Under Review',
      desc: 'Your documents are securely vaulted and awaiting administrative review. This process usually takes 24-48 hours.',
      icon: ClockIcon,
      colorClass: 'text-warning',
      bgClass: 'bg-warning/10 border-warning/20',
    },
    VERIFIED: {
      title: 'Identity Verified',
      desc: 'Your Swentra Vault account is fully verified and active. All restrictions have been lifted.',
      icon: ShieldCheckIcon,
      colorClass: 'text-success',
      bgClass: 'bg-success/10 border-success/20',
    },
    REJECTED: {
      title: 'Verification Failed',
      desc: 'Your application was rejected. Please contact support.',
      icon: ShieldAlertIcon,
      colorClass: 'text-destructive',
      bgClass: 'bg-destructive/10 border-destructive/20',
    },
    MORE_INFORMATION_REQUIRED: {
      title: 'Action Required',
      desc: 'Additional information is required to verify your identity.',
      icon: InfoIcon,
      colorClass: 'text-info',
      bgClass: 'bg-info/10 border-info/20',
    },
  }

  const currentConfig = config[status]
  const Icon = currentConfig.icon

  return (
    <Card className={`border ${currentConfig.bgClass} shadow-none`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${currentConfig.colorClass} bg-background`}>
            <Icon className="size-5" />
          </div>
          <CardTitle className="text-lg font-medium">
            {currentConfig.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {currentConfig.desc}
        </p>

        {rejectionReason && (
          <div className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-xs font-medium text-destructive mb-1">
              Admin Note:
            </p>
            <p className="text-sm text-destructive/90">{rejectionReason}</p>
          </div>
        )}

        <div className="mt-6 border-t border-border/50 pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">SUBMITTED</span>
            <span className="font-mono">
              {record.submittedAt?.toDate().toLocaleDateString('en-GB') ?? 'N/A'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">DOCUMENT NO.</span>
            <span className="font-mono">{record.identityDocument.documentNumber}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
