import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { toast } from 'sonner'
import { ShieldAlertIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/types/accounts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ReverseTarget } from '@/hooks/useReversibleTransactions'

interface ReverseTransactionDialogProps {
  target: ReverseTarget | null
  onClose: () => void
  onReversed?: () => void
}

/**
 * Single source of truth for the reversal confirm + reason flow. Used by the
 * admin ledger drawer, the dashboard widget, and the Reversals page.
 */
export function ReverseTransactionDialog({ target, onClose, onReversed }: ReverseTransactionDialogProps) {
  const [reason, setReason] = useState('')
  const [reversing, setReversing] = useState(false)

  function close() {
    setReason('')
    onClose()
  }

  async function handleReverse() {
    if (!target) return
    if (reason.trim().length < 3) {
      toast.error('Please provide a reversal reason (at least 3 characters).')
      return
    }
    setReversing(true)
    try {
      const reverse = httpsCallable<
        { targetUid: string; transactionId: string; reason: string },
        { success: boolean }
      >(functions, 'adminReverseTransaction')
      await reverse({
        targetUid: target.uid,
        transactionId: target.transactionId,
        reason: reason.trim(),
      })
      toast.success('Transaction reversed successfully.')
      setReason('')
      onClose()
      onReversed?.()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reverse transaction.')
    } finally {
      setReversing(false)
    }
  }

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open && !reversing) close()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlertIcon className="w-5 h-5" />
            Reverse transaction
          </DialogTitle>
          <DialogDescription>
            This refunds the sender and reverses the funds at the recipient. It is recorded in the audit log and cannot be undone from here.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-border bg-black/20 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{target.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatCurrency(target.amount, target.currency as any)}
                </span>
              </div>
              {target.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{target.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reversal-reason">Reason (required)</Label>
              <textarea
                id="reversal-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Duplicate transfer, beneficiary dispute, fraud report…"
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={reversing}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReverse}
            disabled={reversing || reason.trim().length < 3}
          >
            {reversing ? 'Reversing…' : 'Confirm reversal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}