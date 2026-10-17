import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePaginatedTransactions, type DateRange } from '@/hooks/usePaginatedTransactions'
import { Card } from '@/components/ui/card'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { TransactionPagination } from '@/components/shared/TransactionPagination'
import { ArrowDownLeftIcon, ArrowUpRightIcon, Loader2Icon, ClockIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { Transaction } from '@/types/transactions'
import { TransactionDrawer } from '@/components/transactions/TransactionDrawer'

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    signDisplay: 'always'
  }).format(amount)
}

function formatDate(dateStr: any) {
  if (!dateStr) return ''
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function getDateGroupKey(dateStr: any) {
  if (!dateStr) return 'Past'
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [range, setRange] = useState<DateRange>({ from: null, to: null })

  const { docs, loading, hasNext, canPrev, pageIndex, next, prev, refetch } = usePaginatedTransactions({
    scope: 'user',
    uid: user?.uid,
    range,
  })
  const transactions: Transaction[] = docs.map((d) => ({ id: d.id, ...d.data }) as Transaction)
  const selectedTx = transactions.find((t) => t.id === selectedTxId) ?? null

  // Refresh the (one-shot) history when the window regains focus so reversals
  // performed elsewhere show up when the user looks.
  useEffect(() => {
    const onFocus = () => refetch()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refetch])

  const groups: { title: string; items: Transaction[] }[] = []
  
  transactions.forEach((tx) => {
    const key = getDateGroupKey(tx.createdAt)
    let group = groups.find(g => g.title === key)
    if (!group) {
      group = { title: key, items: [] }
      groups.push(group)
    }
    group.items.push(tx)
  })



  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and review all incoming and outgoing transfers.
        </p>
      </div>

      <DateRangeFilter range={range} onChange={setRange} />

      <div className="space-y-6">
        {loading ? (
          <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
            <div className="flex h-40 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
            <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <ClockIcon className="size-8 mb-2 opacity-50" />
              <p className="text-sm">No recent transactions found.</p>
            </div>
          </Card>
        ) : (
          groups.map((group, idx) => (
            <div key={idx} className="space-y-3 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
              <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                {group.title}
              </h3>
              <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
                <div className="divide-y divide-border">
                  {group.items.map((tx) => {
                    const isOutgoing = tx.amount < 0
                    
                    return (
                      <div 
                        key={tx.id} 
                        onClick={() => setSelectedTxId(tx.id)}
                        className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface/60 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex size-10 items-center justify-center rounded-full shrink-0",
                            isOutgoing ? "bg-secondary/20 text-muted-foreground" : "bg-primary/20 text-primary"
                          )}>
                            {isOutgoing ? <ArrowUpRightIcon className="size-5" /> : <ArrowDownLeftIcon className="size-5" />}
                          </div>
                          
                          <div>
                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {(tx.reference || '').toUpperCase().startsWith('REVERSAL') || tx.type === 'REVERSAL_DEBIT'
                                ? 'Reversal'
                                : isOutgoing ? `To ${tx.recipientDetails?.fullName || 'Account'}` : `From ${tx.sourceDetails?.senderName || 'Account'}`}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{formatDate(tx.createdAt).split(',')[1]?.trim() || formatDate(tx.createdAt)}</span>
                              <span>•</span>
                              <span className="font-mono uppercase">{tx.reference}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className={cn(
                              "font-medium",
                              isOutgoing ? "text-foreground" : "text-primary"
                            )}>
                              {formatAmount(tx.amount, tx.currency)}
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1">
                              <span className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase",
                                tx.status === 'COMPLETED' && "bg-primary/10 text-primary",
                                tx.status === 'PROCESSING' && "bg-secondary text-secondary-foreground",
                                tx.status === 'PENDING' && "bg-muted text-muted-foreground",
                                tx.status === 'FAILED' && "bg-destructive/10 text-destructive"
                              )}>
                                {tx.status}
                              </span>
                              {tx.reversed && (
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase bg-destructive/10 text-destructive">
                                  Reversed
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRightIcon className="size-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))
        )}
      </div>

      <TransactionPagination
        pageIndex={pageIndex}
        hasNext={hasNext}
        canPrev={canPrev}
        onPrev={prev}
        onNext={next}
      />

      <TransactionDrawer
        transaction={selectedTx}
        onClose={() => setSelectedTxId(null)}
      />
    </div>
  )
}
