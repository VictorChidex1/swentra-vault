import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDownLeftIcon, ArrowUpRightIcon, Loader2Icon, ClockIcon, ChevronRightIcon, CopyIcon, DownloadIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import type { Transaction } from '@/types/transactions'

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
  const { transactions, loading } = useTransactions()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Reference copied to clipboard')
  }

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
                        onClick={() => setSelectedTx(tx)}
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
                              {isOutgoing ? `To ${tx.recipientDetails?.fullName || 'Account'}` : `From ${tx.sourceDetails?.senderName || 'Account'}`}
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

      <Sheet open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto border-l border-border bg-background/95 backdrop-blur-xl p-6 sm:p-8">
          {selectedTx && (
            <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-12">
              <div className="text-center space-y-2">
                <div className={cn(
                  "mx-auto flex size-12 items-center justify-center rounded-full mb-4",
                  selectedTx.amount < 0 ? "bg-secondary/20 text-muted-foreground" : "bg-primary/20 text-primary"
                )}>
                  {selectedTx.amount < 0 ? <ArrowUpRightIcon className="size-6" /> : <ArrowDownLeftIcon className="size-6" />}
                </div>
                <h2 className="text-4xl font-light tracking-tight text-foreground">
                  {formatAmount(selectedTx.amount, selectedTx.currency)}
                </h2>
                <div className="flex justify-center pt-2">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide uppercase",
                    selectedTx.status === 'COMPLETED' && "bg-primary/10 text-primary",
                    selectedTx.status === 'PROCESSING' && "bg-secondary text-secondary-foreground",
                    selectedTx.status === 'PENDING' && "bg-muted text-muted-foreground",
                    selectedTx.status === 'FAILED' && "bg-destructive/10 text-destructive"
                  )}>
                    {selectedTx.status}
                  </span>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase border-b border-border pb-2">
                    Transaction Details
                  </h3>
                  
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-muted-foreground">{selectedTx.amount < 0 ? 'Sent to' : 'Received from'}</span>
                    <span className="font-medium text-right max-w-[200px]">
                      {selectedTx.amount < 0 ? selectedTx.recipientDetails?.fullName : selectedTx.sourceDetails?.senderName}
                      <br/>
                      <span className="font-mono text-xs text-muted-foreground">
                        {selectedTx.amount < 0 ? selectedTx.recipientDetails?.accountNumber : selectedTx.sourceAccountId}
                      </span>
                    </span>
                  </div>

                  {(selectedTx.recipientDetails?.bankName) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank Name</span>
                      <span className="font-medium">{selectedTx.recipientDetails.bankName}</span>
                    </div>
                  )}

                  {(selectedTx.recipientDetails?.swiftCode) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SWIFT / BIC</span>
                      <span className="font-mono font-medium">{selectedTx.recipientDetails.swiftCode}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-medium">{formatDate(selectedTx.createdAt)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Reference</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-surface/50 px-2 py-1 rounded-md">{selectedTx.reference}</span>
                      <button 
                        onClick={() => copyToClipboard(selectedTx.reference)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface rounded-md transition-colors"
                      >
                        <CopyIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase border-b border-border pb-2">
                    Financial Breakdown
                  </h3>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Principal Amount</span>
                    <span className="font-medium">{formatAmount(Math.abs(selectedTx.amount), selectedTx.currency)}</span>
                  </div>

                  {selectedTx.exchangeRate && selectedTx.exchangeRate !== 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <span className="font-medium">{selectedTx.exchangeRate.toFixed(4)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transfer Fee</span>
                    <span className="font-medium">
                      {selectedTx.amount < 0 ? (selectedTx.type === 'INTERNAL_TRANSFER' ? '$0.00' : 'Included') : '$0.00'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Button variant="outline" className="w-full" onClick={() => toast.info('Receipt generation coming soon.')}>
                  <DownloadIcon className="size-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
