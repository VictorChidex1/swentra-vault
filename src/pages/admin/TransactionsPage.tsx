import { useState, useMemo } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import { formatCurrency } from '@/types/accounts'
import { usePaginatedTransactions, type DateRange } from '@/hooks/usePaginatedTransactions'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { TransactionPagination } from '@/components/shared/TransactionPagination'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ReverseTransactionDialog } from '@/components/admin/ReverseTransactionDialog'
import type { ReverseTarget } from '@/hooks/useReversibleTransactions'
import {
  FileTextIcon,
  SearchIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ArrowRightLeftIcon,
  Loader2Icon,
  CalendarIcon,
  UserIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
  XIcon
} from 'lucide-react'

// Extended interface for the global ledger
interface AdminTransactionRecord {
  id: string
  uid: string
  accountId: string
  type: string
  amount: number
  currency: string
  status: string
  reference: string
  description?: string
  timestamp?: string | Date
  createdAt?: any
  metadata?: any
  reversed?: boolean
  reversalReason?: string
}

interface AdminUserRecord {
  uid: string
  email: string
}

export default function AdminTransactionsPage() {
  // Fetch Users for Cross-Referencing
  const usersFetcher = useMemo(() => async () => {
    const adminListUsers = httpsCallable<void, { users: AdminUserRecord[] }>(functions, 'adminListUsers')
    const result = await adminListUsers()
    return result.data.users
  }, [])
  const { data: usersData, loading: loadingUsers } = useAdminCache('admin-users', usersFetcher)
  const users = usersData || []

  // Create a fast lookup map for UID -> Email
  const userMap = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach(u => map.set(u.uid, u.email))
    return map
  }, [users])

  // Paginated global ledger (12/page) with a server-side date range; total count
  // is included (count() ≈ 1 read per 1,000 rows).
  const [range, setRange] = useState<DateRange>({ from: null, to: null })
  const {
    docs: txDocs,
    loading: loadingTx,
    count,
    hasNext,
    canPrev,
    pageIndex,
    next,
    prev,
    refetch: refetchTx,
  } = usePaginatedTransactions({ scope: 'all', range, withCount: true })

  const transactions = useMemo<AdminTransactionRecord[]>(
    () => txDocs.map((d) => ({ id: d.id, uid: d.uid || '', ...d.data }) as AdminTransactionRecord),
    [txDocs],
  )

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [selectedTx, setSelectedTx] = useState<AdminTransactionRecord | null>(null)
  const [reversalTarget, setReversalTarget] = useState<ReverseTarget | null>(null)

  const canReverse = (tx: AdminTransactionRecord) =>
    tx.amount < 0 && !tx.reversed && tx.status !== 'FAILED'

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const email = userMap.get(tx.uid) || 'Unknown User'
      
      // Match Search
      const matchesSearch = 
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchTerm.toLowerCase())

      // Match Type
      const matchesType = typeFilter === 'ALL' || tx.type === typeFilter

      return matchesSearch && matchesType
    })
  }, [transactions, searchTerm, typeFilter, userMap])

  const getTypeIcon = (type: string) => {
    if (type === 'DEPOSIT' || type === 'INCOMING_TRANSFER') return <ArrowDownRightIcon className="w-4 h-4 text-green-500" />
    if (type === 'WITHDRAWAL') return <ArrowUpRightIcon className="w-4 h-4 text-red-500" />
    return <ArrowRightLeftIcon className="w-4 h-4 text-blue-500" />
  }

  const getTypeColor = (type: string) => {
    if (type === 'DEPOSIT' || type === 'INCOMING_TRANSFER') return 'text-green-500 bg-green-500/10 border-green-500/20'
    if (type === 'WITHDRAWAL') return 'text-red-500 bg-red-500/10 border-red-500/20'
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  }

  const formatTxDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown Date'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div>
        <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
          <FileTextIcon className="w-6 h-6 text-primary" />
          Global Transactions Ledger
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete audit trail of all platform transactions.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reference, description, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'SWENTRA_TRANSFER', 'EXTERNAL_WIRE'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors ${
                typeFilter === type 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-surface border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <DateRangeFilter range={range} onChange={setRange} />

      <Card className="flex-1 min-h-0 bg-surface border-border overflow-hidden flex flex-col">
        {loadingTx || loadingUsers ? (
          <div className="h-full flex items-center justify-center flex-col text-muted-foreground py-16">
            <Loader2Icon className="w-8 h-8 animate-spin text-primary mb-4" />
            <p>Loading ledger data...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col text-muted-foreground py-16">
            <FileTextIcon className="w-12 h-12 mb-4 opacity-20" />
            <p>No transactions found matching your filters.</p>
          </div>
        ) : (
          <>
            {/* Mobile Tactical Card List (Zero horizontal scrolling; Amount & Status prominent) */}
            <div className="block md:hidden flex-1 overflow-y-auto divide-y divide-border">
              {filteredTransactions.map((tx) => {
                const isCredit = tx.type === 'DEPOSIT' || tx.type === 'INCOMING_TRANSFER'
                return (
                  <div 
                    key={tx.id} 
                    onClick={() => setSelectedTx(tx)}
                    className="p-4 flex flex-col gap-2.5 hover:bg-primary/5 transition-colors cursor-pointer group"
                  >
                    {/* Top Row: Icon + Description & Amount + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getTypeColor(tx.type)}`}>
                          {getTypeIcon(tx.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors text-sm line-clamp-1">
                            {tx.description || tx.reference || 'Transaction'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                            <CalendarIcon className="w-3 h-3 shrink-0" />
                            <span>{formatTxDate(tx.createdAt ?? tx.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-base font-bold font-mono tracking-tight ${isCredit ? 'text-green-500' : 'text-foreground'}`}>
                          {isCredit ? '+' : '-'}
                          {formatCurrency(tx.amount, tx.currency as any)}
                        </div>
                        <div className="mt-1">
                          <Badge 
                            variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'} 
                            className={`text-[9px] px-1.5 py-0.5 font-medium ${
                              tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''
                            }`}
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: User Email & Monospace Type Badge */}
                    <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-muted-foreground truncate min-w-0">
                        <UserIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{userMap.get(tx.uid) || 'Unknown User'}</span>
                      </div>
                      <Badge variant="outline" className={`font-mono text-[9px] shrink-0 uppercase tracking-wider ${getTypeColor(tx.type)}`}>
                        {tx.type}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop High-Density Table */}
            <div className="hidden md:block flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-surface/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-medium border-b border-border">Transaction</th>
                    <th className="px-6 py-4 font-medium border-b border-border hidden md:table-cell">User</th>
                    <th className="px-6 py-4 font-medium border-b border-border">Type</th>
                    <th className="px-6 py-4 font-medium border-b border-border text-right">Amount</th>
                    <th className="px-6 py-4 font-medium border-b border-border text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(tx.type)}`}>
                            {getTypeIcon(tx.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors max-w-[280px] truncate" title={tx.description || tx.reference}>
                              {tx.description || tx.reference || 'Transaction'}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                              <CalendarIcon className="w-3 h-3 shrink-0" />
                              {formatTxDate(tx.createdAt ?? tx.timestamp)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{userMap.get(tx.uid) || 'Unknown User'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-mono text-[10px] ${getTypeColor(tx.type)}`}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        <span className={tx.type === 'DEPOSIT' || tx.type === 'INCOMING_TRANSFER' ? 'text-green-500' : 'text-foreground'}>
                          {tx.type === 'DEPOSIT' || tx.type === 'INCOMING_TRANSFER' ? '+' : '-'}
                          {formatCurrency(tx.amount, tx.currency as any)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={tx.status === 'COMPLETED' ? 'default' : 'secondary'} className={
                          tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''
                        }>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!loadingTx && !loadingUsers && (
          <TransactionPagination
            pageIndex={pageIndex}
            hasNext={hasNext}
            canPrev={canPrev}
            onPrev={prev}
            onNext={next}
            count={count}
          />
        )}
      </Card>

      {/* Audit Modal Overlay */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-surface h-full border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface/50 backdrop-blur-md">
              <h2 className="font-medium text-lg flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-primary" />
                Transaction Audit
              </h2>
              <button 
                onClick={() => setSelectedTx(null)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Massive Amount Display */}
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${getTypeColor(selectedTx.type)}`}>
                  {getTypeIcon(selectedTx.type)}
                </div>
                <div className="text-3xl font-light tracking-tight">
                  {selectedTx.type === 'DEPOSIT' || selectedTx.type === 'INCOMING_TRANSFER' ? '+' : '-'}
                  {formatCurrency(selectedTx.amount, selectedTx.currency as any)}
                </div>
                <Badge variant="outline" className={getTypeColor(selectedTx.type)}>
                  {selectedTx.status}
                </Badge>
              </div>

              {/* Core Details */}
              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Core Metadata</h3>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Reference ID</span>
                  <span className="font-mono">{selectedTx.reference}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{selectedTx.type}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span className="text-right">{formatTxDate(selectedTx.createdAt ?? selectedTx.timestamp)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <span className="text-right max-w-[60%] truncate" title={selectedTx.description}>
                    {selectedTx.description || 'N/A'}
                  </span>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-border">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Target User</h3>
                
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{userMap.get(selectedTx.uid) || 'Unknown User'}</span>
                </div>
                
                <div className="flex flex-col gap-1 text-sm mt-3">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-xs">{selectedTx.uid}</span>
                </div>

                <div className="flex flex-col gap-1 text-sm mt-3">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-xs">{selectedTx.accountId || 'N/A'}</span>
                </div>
              </div>

              {/* Audit/Admin Metadata */}
              {selectedTx.metadata && (
                <div className="space-y-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                    <UserIcon className="w-3 h-3" />
                    Admin Action Trail
                  </h3>
                  
                  {Object.entries(selectedTx.metadata).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono text-xs max-w-[60%] truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Administrative Actions */}
              <div className="space-y-4 bg-destructive/5 p-4 rounded-xl border border-destructive/20">
                <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldAlertIcon className="w-3 h-3" />
                  Administrative Actions
                </h3>

                {selectedTx.reversed ? (
                  <p className="text-sm text-muted-foreground">
                    This transaction has been reversed.
                    {selectedTx.reversalReason ? ` Reason: ${selectedTx.reversalReason}` : ''}
                  </p>
                ) : canReverse(selectedTx) ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Reversing refunds the sender and claws the funds back from the recipient. This is recorded in the audit log.
                    </p>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() =>
                        setReversalTarget({
                          uid: selectedTx.uid,
                          transactionId: selectedTx.id,
                          reference: selectedTx.reference,
                          amount: selectedTx.amount,
                          currency: selectedTx.currency,
                          email: userMap.get(selectedTx.uid),
                        })
                      }
                    >
                      <RotateCcwIcon className="w-4 h-4 mr-2" />
                      Reverse transaction
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This transaction is not eligible for reversal.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <ReverseTransactionDialog
        target={reversalTarget}
        onClose={() => setReversalTarget(null)}
        onReversed={() => {
          setSelectedTx(null)
          refetchTx()
        }}
      />
    </div>
  )
}
