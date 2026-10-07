import { ArrowDownLeftIcon, ArrowUpRightIcon, CopyIcon, DownloadIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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

interface TransactionDrawerProps {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionDrawer({ transaction, onClose }: TransactionDrawerProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Reference copied to clipboard')
  }

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 sm:p-8 overflow-y-auto">
        <SheetHeader className="mb-8">
          <SheetTitle className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
            Transaction Details
          </SheetTitle>
        </SheetHeader>

        {transaction && (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
            {/* Header Amount */}
            <div className="flex flex-col items-center justify-center space-y-4 py-4">
              <div className={cn(
                "flex size-16 items-center justify-center rounded-full shadow-inner",
                transaction.amount < 0 ? "bg-secondary/20 text-muted-foreground" : "bg-primary/20 text-primary"
              )}>
                {transaction.amount < 0 ? <ArrowUpRightIcon className="size-6" /> : <ArrowDownLeftIcon className="size-6" />}
              </div>
              <h2 className="text-4xl font-light tracking-tight text-foreground">
                {formatAmount(transaction.amount, transaction.currency)}
              </h2>
              <div className="flex justify-center pt-2">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide uppercase",
                  transaction.status === 'COMPLETED' && "bg-primary/10 text-primary",
                  transaction.status === 'PROCESSING' && "bg-secondary text-secondary-foreground",
                  transaction.status === 'PENDING' && "bg-muted text-muted-foreground",
                  transaction.status === 'FAILED' && "bg-destructive/10 text-destructive"
                )}>
                  {transaction.status}
                </span>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase border-b border-border pb-2">
                  Transaction Info
                </h3>
                
                <div className="flex justify-between items-start text-sm">
                  <span className="text-muted-foreground">{transaction.amount < 0 ? 'Sent to' : 'Received from'}</span>
                  <span className="font-medium text-right max-w-[200px]">
                    {transaction.amount < 0 ? transaction.recipientDetails?.fullName : transaction.sourceDetails?.senderName}
                    <br/>
                    <span className="font-mono text-xs text-muted-foreground">
                      {transaction.amount < 0 ? transaction.recipientDetails?.accountNumber : transaction.sourceAccountId}
                    </span>
                  </span>
                </div>

                {(transaction.recipientDetails?.bankName) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank Name</span>
                    <span className="font-medium">{transaction.recipientDetails.bankName}</span>
                  </div>
                )}

                {(transaction.recipientDetails?.swiftCode) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SWIFT / BIC</span>
                    <span className="font-mono font-medium">{transaction.recipientDetails.swiftCode}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date & Time</span>
                  <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-surface/50 px-2 py-1 rounded-md">{transaction.reference}</span>
                    <button 
                      onClick={() => copyToClipboard(transaction.reference)}
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
                  <span className="font-medium">{formatAmount(Math.abs(transaction.amount), transaction.currency)}</span>
                </div>

                {transaction.exchangeRate && transaction.exchangeRate !== 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">{transaction.exchangeRate.toFixed(4)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transfer Fee</span>
                  <span className="font-medium">
                    {transaction.amount < 0 ? (transaction.type === 'INTERNAL_TRANSFER' ? '$0.00' : 'Included') : '$0.00'}
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
  )
}
