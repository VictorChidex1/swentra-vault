import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { Card } from '@/components/ui/card'
import { FileTextIcon, Loader2Icon, SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import type { Transaction } from '@/types/transactions'
import { ReceiptPreviewModal } from '@/components/receipts/ReceiptPreviewModal'

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

export default function ReceiptsPage() {
  const { transactions, loading } = useTransactions()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState('')

  // Receipts are only for COMPLETED transactions
  const completedTransactions = transactions.filter(tx => tx.status === 'COMPLETED')

  const filtered = completedTransactions.filter(t => {
    const s = search.toLowerCase()
    return t.id.toLowerCase().includes(s) || 
           t.reference.toLowerCase().includes(s) ||
           t.recipientDetails?.fullName?.toLowerCase().includes(s) ||
           t.sourceDetails?.senderName?.toLowerCase().includes(s)
  })

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Official Receipts
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download PDF receipts for your completed transactions.
        </p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by transaction ID, reference, or name..." 
          className="pl-10 bg-surface/50 border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {loading ? (
          <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
            <div className="flex h-40 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
            <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <FileTextIcon className="size-8 mb-2 opacity-50" />
              <p className="text-sm">No receipts found matching your search.</p>
            </div>
          </Card>
        ) : (
          <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
            <div className="divide-y divide-border">
              {filtered.map((tx) => {
                const isOutgoing = tx.amount < 0
                
                return (
                  <div 
                    key={tx.id} 
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-surface/60 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-full shrink-0 bg-surface text-muted-foreground border border-border">
                        <FileTextIcon className="size-5" />
                      </div>
                      
                      <div>
                        <div className="font-medium text-foreground">
                          {isOutgoing ? `To ${tx.recipientDetails?.fullName || 'Account'}` : `From ${tx.sourceDetails?.senderName || 'Account'}`}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{formatDate(tx.createdAt)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-mono uppercase">{tx.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block mr-4">
                        <div className="font-medium text-foreground">
                          {formatAmount(Math.abs(tx.amount), tx.currency)}
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase bg-primary/10 text-primary">
                            Settled
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedTx(tx)}
                        className="gap-2 shrink-0"
                      >
                        <FileTextIcon className="size-4" />
                        <span className="hidden sm:inline">View Receipt</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      <ReceiptPreviewModal 
        transaction={selectedTx} 
        open={!!selectedTx} 
        onOpenChange={(open) => !open && setSelectedTx(null)} 
      />
    </div>
  )
}
