import { ShieldCheckIcon } from 'lucide-react'

export function SecurityStateCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 px-4 py-3">
      <ShieldCheckIcon className="size-5 text-success" />
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-wider text-success">
          Connection Secured
        </p>
        <p className="text-xs text-muted-foreground">
          256-bit AES Encryption Active
        </p>
      </div>
    </div>
  )
}
