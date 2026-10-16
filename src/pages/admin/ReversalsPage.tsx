import { useMemo, useState } from 'react'
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import {
  useReversibleTransactions,
  toReverseTarget,
  type ReversibleTx,
  type ReverseTarget,
} from '@/hooks/useReversibleTransactions'
import { ReverseTransactionDialog } from '@/components/admin/ReverseTransactionDialog'
import { ReverseTransactionPicker } from '@/components/admin/ReverseTransactionPicker'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/types/accounts'
import { RotateCcwIcon, SearchIcon, Loader2Icon, ShieldAlertIcon } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  SWENTRA_TRANSFER: 'Swentra transfer',
  EXTERNAL_WIRE: 'External wire',
  INTERNAL_TRANSFER: 'Internal transfer',
}

function formatDate(value: any) {
  if (!value) return '—'
  const date = value.toDate ? value.toDate() : new Date(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date)
}

export default function ReversalsPage() {
  const { transactions, loading, refetch } = useReversibleTransactions()
  const [term, setTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [target, setTarget] = useState<ReverseTarget | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Recently reversed — from the audit trail.
  const auditFetcher = useMemo(() => async () => {
    const q = query(collection(db, 'auditLogs'), orderBy('occurredAt', 'desc'), limit(100))
    const snap = await getDocs(q)
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((a) => a.action === 'admin.reverse_transaction')
      .slice(0, 20)
  }, [])
  const { data: reversed } = useAdminCache<any[]>('admin-reversals-history', auditFetcher)

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase()
    return transactions.filter((tx) => {
      const matchesTerm =
        !t ||
        tx.reference.toLowerCase().includes(t) ||
        tx.email.toLowerCase().includes(t) ||
        tx.id.toLowerCase().includes(t) ||
        (tx.recipientDetails?.fullName || '').toLowerCase().includes(t)
      const matchesType = typeFilter === 'ALL' || tx.type === typeFilter
      return matchesTerm && matchesType
    })
  }, [transactions, term, typeFilter])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
            <RotateCcwIcon className="w-6 h-6 text-primary" />
            Reversals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Only transactions eligible for reversal are listed here.
          </p>
        </div>
        <Button onClick={() => setPickerOpen(true)}>
          <SearchIcon className="w-4 h-4 mr-2" />
          Search all transactions
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reference, user email, or ID…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['ALL', 'SWENTRA_TRANSFER', 'EXTERNAL_WIRE'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2Icon className="w-6 h-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No reversible transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-surface/50">
                <tr>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium hidden md:table-cell">Recipient</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">Type</th>
                  <th className="px-6 py-3 font-medium hidden lg:table-cell">Reference</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((tx: ReversibleTx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setTarget(toReverseTarget(tx))}
                    className="hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-destructive">
                      {formatCurrency(tx.amount, tx.currency as any)}
                    </td>
                    <td className="px-6 py-4">
                      {tx.email}
                      {tx.status !== 'COMPLETED' && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">{tx.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                      {tx.recipientDetails?.fullName || '—'}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {TYPE_LABELS[tx.type] || tx.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell font-mono text-xs">{tx.reference}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTarget(toReverseTarget(tx))
                        }}
                      >
                        <RotateCcwIcon className="w-3.5 h-3.5 mr-1" />
                        Reverse
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
          <ShieldAlertIcon className="w-5 h-5 text-muted-foreground" />
          Recently reversed
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Latest reversals recorded in the audit trail.
        </p>
        <Card className="mt-4 bg-surface border-border divide-y divide-border">
          {!reversed || reversed.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No reversals recorded yet.
            </div>
          ) : (
            reversed.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {a.description || 'Transaction reversed'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {a.reason ? `Reason: ${a.reason}` : 'No reason recorded'} · by {a.actorUid || 'unknown'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(a.occurredAt)}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      <ReverseTransactionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(tx) => {
          setPickerOpen(false)
          setTarget(toReverseTarget(tx))
        }}
      />
      <ReverseTransactionDialog target={target} onClose={() => setTarget(null)} onReversed={refetch} />
    </div>
  )
}