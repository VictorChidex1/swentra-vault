import { useTransactions } from '@/hooks/useTransactions'
import { Card } from '@/components/ui/card'
import { ArrowDownLeftIcon, ArrowUpRightIcon, Loader2Icon, ClockIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    signDisplay: 'always'
  }).format(amount)
}

function formatDate(dateStr: any) {
  if (!dateStr) return ''
  // Firestore timestamp
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

export default function TransactionsPage() {
  const { transactions, loading } = useTransactions()

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-foreground">
          Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and review all incoming and outgoing transfers.
        </p>
      </div>

      <Card className="p-0 bg-surface/30 backdrop-blur-sm border-border overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
            <ClockIcon className="size-8 mb-2 opacity-50" />
            <p className="text-sm">No recent transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => {
              const isOutgoing = tx.amount < 0
              
              return (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-surface/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-full shrink-0",
                      isOutgoing ? "bg-secondary/20 text-muted-foreground" : "bg-primary/20 text-primary"
                    )}>
                      {isOutgoing ? <ArrowUpRightIcon className="size-5" /> : <ArrowDownLeftIcon className="size-5" />}
                    </div>
                    
                    <div>
                      <div className="font-medium text-foreground">
                        {isOutgoing ? `To ${tx.recipientDetails?.fullName || 'Account'}` : `From ${tx.sourceDetails?.senderName || 'Account'}`}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatDate(tx.createdAt)}</span>
                        <span>•</span>
                        <span className="font-mono uppercase">{tx.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={cn(
                      "font-medium",
                      isOutgoing ? "text-foreground" : "text-primary"
                    )}>
                      {formatAmount(tx.amount, tx.currency)}
                    </div>
                    <div className="mt-1">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase",
                        tx.status === 'COMPLETED' && "bg-primary/10 text-primary",
                        tx.status === 'PROCESSING' && "bg-secondary text-secondary-foreground",
                        tx.status === 'PENDING' && "bg-muted text-muted-foreground",
                        tx.status === 'FAILED' && "bg-destructive/10 text-destructive"
                      )}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
