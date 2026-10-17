import { useMemo, useState } from 'react'
import { collection, query, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import { toReverseTarget, type ReversibleTx, type ReverseTarget } from '@/hooks/useReversibleTransactions'
import { usePaginatedTransactions, type DateRange } from '@/hooks/usePaginatedTransactions'
import { ReverseTransactionDialog } from '@/components/admin/ReverseTransactionDialog'
import { ReverseTransactionPicker } from '@/components/admin/ReverseTransactionPicker'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { TransactionPagination } from '@/components/shared/TransactionPagination'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/types/accounts'
import { RotateCcwIcon, SearchIcon, Loader2Icon, ShieldAlertIcon } from 'lucide-react'

const ELIGIBLE_TYPES = ['SWENTRA_TRANSFER', 'EXTERNAL_WIRE']
const REV_PER_PAGE = 5

function maskAcct(acct?: string): string {
  const c = String(acct || '').replace(/\s/g, '')
  if (!c) return ''
  return c.length <= 4 ? `****${c}` : `****${c.slice(-4)}`
}

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
  const [term, setTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [target, setTarget] = useState<ReverseTarget | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [range, setRange] = useState<DateRange>({ from: null, to: null })
  const [revPage, setRevPage] = useState(0)
  const [detail, setDetail] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const usersFetcher = useMemo(() => async () => {
    const adminListUsers = httpsCallable<void, { users: { uid: string; email: string }[] }>(functions, 'adminListUsers')
    return (await adminListUsers()).data.users
  }, [])
  const { data: users } = useAdminCache('admin-users', usersFetcher)
  const userMap = useMemo(() => {
    const m = new Map<string, string>()
    ;(users || []).forEach((u) => m.set(u.uid, u.email))
    return m
  }, [users])

  const { docs, loading, hasNext, canPrev, pageIndex, next, prev, refetch } = usePaginatedTransactions({
    scope: 'all',
    range,
  })

  const transactions = useMemo<ReversibleTx[]>(() => {
    return docs
      .filter((d) => {
        const t = d.data
        if (t.amount >= 0) return false
        if (t.status === 'FAILED') return false
        if (t.reversed) return false
        if (!t.sourceAccountId) return false
        if (!ELIGIBLE_TYPES.includes(t.type)) return false
        const src = String(t.sourceAccountId)
        if (src === 'MINT' || src.startsWith('system-')) return false
        return true
      })
      .map((d) => {
        const t = d.data
        return {
          id: d.id,
          uid: d.uid || '',
          email: userMap.get(d.uid || '') || 'Unknown User',
          amount: t.amount,
          currency: t.currency,
          type: t.type,
          status: t.status,
          reference: t.reference || 'Transaction',
          createdAt: t.createdAt ?? t.timestamp,
          recipientDetails: t.recipientDetails,
        } as ReversibleTx
      })
  }, [docs, userMap])

  // Recently reversed — from the audit trail.
  const auditFetcher = useMemo(() => async () => {
    const q = query(collection(db, 'auditLogs'), orderBy('occurredAt', 'desc'), limit(30))
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

  const revEntries = (reversed || []) as any[]
  const revPageCount = Math.max(1, Math.ceil(revEntries.length / REV_PER_PAGE))
  const revSafePage = Math.min(revPage, revPageCount - 1)
  const revSlice = revEntries.slice(revSafePage * REV_PER_PAGE, revSafePage * REV_PER_PAGE + REV_PER_PAGE)

  async function openReversalDetail(entry: any) {
    setDetail(entry)
    const d = entry.details || {}
    // Legacy entries (reversed before enrichment) lack the snapshot → fetch the
    // original transaction once to fill it in.
    if (d.amount === undefined && entry.targetUid && entry.transactionId) {
      setDetailLoading(true)
      try {
        const snap = await getDoc(doc(db, 'users', entry.targetUid, 'transactions', entry.transactionId))
        if (snap.exists()) {
          const t = snap.data() as any
          setDetail({
            ...entry,
            details: {
              ...d,
              originalTransactionId: entry.transactionId,
              type: t.type,
              reference: t.reference,
              amount: Math.abs(t.amount ?? 0),
              currency: t.currency,
              recipient: t.recipientDetails
                ? {
                    fullName: t.recipientDetails.fullName,
                    bankName: t.recipientDetails.bankName,
                    accountNumber: maskAcct(t.recipientDetails.accountNumber),
                  }
                : null,
            },
          })
        }
      } catch (error) {
        console.error('Failed to load original transaction:', error)
      } finally {
        setDetailLoading(false)
      }
    }
  }

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

      <DateRangeFilter range={range} onChange={setRange} />

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
          <>
            {/* Mobile Tactical Card List (Zero horizontal scrolling; Reverse button front & center) */}
            <div className="block md:hidden divide-y divide-border">
              {filtered.map((tx: ReversibleTx) => (
                <div
                  key={tx.id}
                  onClick={() => setTarget(toReverseTarget(tx))}
                  className="p-4 flex flex-col gap-2.5 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  {/* Top Row: Amount & Direct Reverse Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base font-bold text-destructive font-mono tracking-tight">
                        {formatCurrency(tx.amount, tx.currency as any)}
                      </span>
                      {tx.status !== 'COMPLETED' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          {tx.status}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold shrink-0 shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTarget(toReverseTarget(tx))
                      }}
                    >
                      <RotateCcwIcon className="w-3.5 h-3.5 mr-1" />
                      Reverse
                    </Button>
                  </div>

                  {/* Middle Row: User Email & Type Badge */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-medium text-foreground truncate">
                      {tx.email}
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] shrink-0 uppercase tracking-wider">
                      {TYPE_LABELS[tx.type] || tx.type}
                    </Badge>
                  </div>

                  {/* Bottom Row: Counterparty & Reference */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground gap-2 pt-0.5">
                    <span className="truncate">
                      &rarr; {tx.recipientDetails?.fullName || 'External Recipient'}
                      {tx.recipientDetails?.bankName ? ` &bull; ${tx.recipientDetails.bankName}` : ''}
                    </span>
                    <span className="font-mono text-[11px] shrink-0 text-muted-foreground/80">
                      {tx.reference}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Full-Density Data Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-surface/50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Recipient</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Reference</th>
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
                      <td className="px-6 py-4 text-muted-foreground">
                        {tx.recipientDetails?.fullName || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {TYPE_LABELS[tx.type] || tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{tx.reference}</td>
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
          </>
        )}
        {!loading && (
          <TransactionPagination
            pageIndex={pageIndex}
            hasNext={hasNext}
            canPrev={canPrev}
            onPrev={prev}
            onNext={next}
          />
        )}
      </Card>

      <div>
        <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
          <ShieldAlertIcon className="w-5 h-5 text-muted-foreground" />
          Recently reversed
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Latest reversals from the audit trail. Tap one for details.
        </p>
        <Card className="mt-4 bg-surface border-border overflow-hidden">
          {revEntries.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No reversals recorded yet.
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {revSlice.map((a) => {
                  const d = a.details || {}
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => openReversalDetail(a)}
                      className="w-full text-left p-4 hover:bg-primary/5 transition-colors flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-destructive font-mono text-sm">
                          {d.amount != null
                            ? formatCurrency(d.amount, d.currency)
                            : (a.description || 'Transaction reversed')}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(a.occurredAt)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {d.recipient?.fullName ? `→ ${d.recipient.fullName}` : 'Recipient not recorded'}
                        {a.reason ? ` · Reason: ${a.reason}` : ''}
                      </div>
                    </button>
                  )
                })}
              </div>
              <TransactionPagination
                pageIndex={revSafePage}
                hasNext={revSafePage < revPageCount - 1}
                canPrev={revSafePage > 0}
                onPrev={() => setRevPage((p) => Math.max(0, p - 1))}
                onNext={() => setRevPage((p) => p + 1)}
              />
            </>
          )}
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcwIcon className="w-5 h-5 text-destructive" />
              Reversal details
            </DialogTitle>
            <DialogDescription>Snapshot of the reversed transaction.</DialogDescription>
          </DialogHeader>

          {detail && (() => {
            const d = detail.details || {}
            return (
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Amount</span>
                  <span className="text-right font-mono text-xs">
                    {d.amount != null
                      ? formatCurrency(d.amount, d.currency)
                      : (detailLoading ? 'Loading…' : '—')}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Reason</span>
                  <span className="text-right font-medium">{detail.reason || '—'}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Recipient</span>
                  <span className="text-right font-medium">
                    {d.recipient?.fullName || '—'}
                    {(d.recipient?.bankName || d.recipient?.accountNumber) && (
                      <span className="block text-xs text-muted-foreground font-mono">
                        {[d.recipient?.bankName, d.recipient?.accountNumber].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Type</span>
                  <span className="text-right font-medium">{TYPE_LABELS[d.type] || d.type || '—'}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Reference</span>
                  <span className="text-right font-mono text-xs break-all">{d.reference || '—'}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Original transaction</span>
                  <span className="text-right font-mono text-xs break-all">
                    {d.originalTransactionId || detail.transactionId || '—'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Reversed by</span>
                  <span className="text-right font-medium">
                    {userMap.get(detail.actorUid) || detail.actorUid || '—'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Date</span>
                  <span className="text-right">{formatDate(detail.occurredAt)}</span>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

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