import { useMemo, useState } from 'react'
import { SearchIcon, Loader2Icon, RotateCcwIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/types/accounts'
import { useReversibleTransactions, type ReversibleTx } from '@/hooks/useReversibleTransactions'

interface ReverseTransactionPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (tx: ReversibleTx) => void
}

/**
 * Search-and-select over recent eligible transactions. Selecting a row hands
 * off to ReverseTransactionDialog (owned by the parent).
 */
export function ReverseTransactionPicker({ open, onOpenChange, onSelect }: ReverseTransactionPickerProps) {
  const { transactions, loading } = useReversibleTransactions()
  const [term, setTerm] = useState('')

  const results = useMemo(() => {
    const t = term.trim().toLowerCase()
    if (!t) return transactions.slice(0, 20)
    return transactions
      .filter(
        (tx) =>
          tx.reference.toLowerCase().includes(t) ||
          tx.email.toLowerCase().includes(t) ||
          tx.id.toLowerCase().includes(t) ||
          (tx.recipientDetails?.fullName || '').toLowerCase().includes(t),
      )
      .slice(0, 20)
  }, [transactions, term])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcwIcon className="w-5 h-5 text-primary" />
            Reverse a transaction
          </DialogTitle>
          <DialogDescription>
            Search a recent eligible transaction by reference, user email, or ID.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search reference, email, or ID…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-lg border border-border">
          {loading ? (
            <div className="p-6 flex items-center justify-center text-muted-foreground">
              <Loader2Icon className="w-5 h-5 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No reversible transactions found.
            </div>
          ) : (
            results.map((tx) => (
              <button
                key={tx.id}
                onClick={() => onSelect(tx)}
                className="w-full text-left p-3 hover:bg-primary/5 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {formatCurrency(tx.amount, tx.currency as any)} · {tx.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    → {tx.recipientDetails?.fullName || 'Recipient'} ·{' '}
                    <span className="font-mono">{tx.reference}</span>
                  </div>
                </div>
                <RotateCcwIcon className="w-4 h-4 text-destructive shrink-0" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}