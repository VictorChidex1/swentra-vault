import { CopyIcon, DownloadIcon, AlertCircleIcon, CheckIcon, CheckCircle2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Transaction } from '@/types/transactions'
import { useAccounts } from '@/hooks/useAccounts'

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
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

// Generates fake intermediate timestamps based on createdAt to make the timeline look real
function getTimelineDates(dateStr: any) {
  if (!dateStr) return { payment: '', processing: '', received: '' }
  const baseDate = dateStr.toDate ? dateStr.toDate() : new Date(dateStr)
  
  const paymentTime = baseDate
  const processingTime = new Date(baseDate.getTime() + 1000) // +1 second
  const receivedTime = new Date(baseDate.getTime() + 26000) // +26 seconds
  
  const formatTime = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }).format(d)
    return `${mm}-${dd} ${time}`
  }

  return {
    payment: formatTime(paymentTime),
    processing: formatTime(processingTime),
    received: formatTime(receivedTime)
  }
}

interface TransactionDrawerProps {
  transaction: Transaction | null
  onClose: () => void
}

export function TransactionDrawer({ transaction, onClose }: TransactionDrawerProps) {
  const { accounts } = useAccounts()
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (!transaction) return null

  // Payment Method Lookup
  const sourceAccount = accounts.find(a => a.id === transaction.sourceAccountId)
  const paymentMethod = sourceAccount ? `${sourceAccount.currency} ${sourceAccount.type === 'current' ? 'Current' : 'Reserve'}` : 'Vault Account'

  // Titles & Headings
  const isOutgoing = transaction.amount < 0
  const title = isOutgoing
    ? `Transfer to ${transaction.recipientDetails?.fullName || transaction.recipientDetails?.accountNumber || 'Unknown'}`
    : `Received from ${transaction.sourceDetails?.senderName || 'Unknown'}`

  // Timeline State
  const timelineDates = getTimelineDates(transaction.createdAt)
  
  const steps = [
    { label: 'Payment successful', date: timelineDates.payment, completed: true },
    { label: 'Processing by bank', date: timelineDates.processing, completed: transaction.status === 'COMPLETED' || transaction.status === 'PROCESSING' },
    { label: 'Received by bank', date: timelineDates.received, completed: transaction.status === 'COMPLETED' },
  ]

  // Overall Status Text
  const statusColor = 
    transaction.status === 'COMPLETED' ? 'text-[#10b981]' : 
    transaction.status === 'PROCESSING' ? 'text-[#f59e0b]' : 
    transaction.status === 'FAILED' ? 'text-[#ef4444]' : 'text-[#6b7280]'
    
  const statusText = 
    transaction.status === 'COMPLETED' ? 'Successful' : 
    transaction.status === 'PROCESSING' ? 'Processing' : 
    transaction.status === 'FAILED' ? 'Failed' : 'Pending'

  return (
    <Sheet open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto bg-[#1a1a1a] border-l border-[#2e2e2e]">
        
        {/* Top App Bar area (simulated) */}
        <div className="flex items-center justify-between p-4 bg-[#1a1a1a]">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="font-semibold text-white tracking-wide">Transaction Details</span>
          <div className="p-2 text-[#10b981]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Main Card */}
          <div className="bg-[#242424] rounded-2xl p-6 flex flex-col items-center relative mt-6">
            
            {/* Logo Badge */}
            <div className="absolute -top-6 bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-[3px] border-[#242424]">
               <div className="bg-[#0066ff] w-8 h-8 rounded-full flex items-center justify-center">
                 <span className="text-white font-bold text-lg">M</span>
               </div>
            </div>

            <div className="text-center mt-6 space-y-2">
              <h3 className="text-white/90 text-sm font-medium px-4">{title}</h3>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                {formatAmount(Math.abs(transaction.amount), transaction.currency)}
              </h1>
              <p className={cn("font-medium", statusColor)}>{statusText}</p>
            </div>

            {/* Stepper Timeline */}
            <div className="w-full mt-10">
              <div className="flex justify-between relative px-2">
                {/* Connecting Lines */}
                <div className="absolute top-3 left-8 right-8 flex justify-between z-0">
                  <div className={cn("h-[2px] w-1/2", steps[1].completed ? "bg-[#10b981]" : "bg-[#3f3f3f]")} />
                  <div className={cn("h-[2px] w-1/2", steps[2].completed ? "bg-[#10b981]" : "bg-[#3f3f3f]")} />
                </div>
                
                {/* Step Nodes */}
                {steps.map((step, i) => (
                  <div key={i} className="flex flex-col items-center z-10 w-24">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center mb-2",
                      step.completed ? "bg-[#10b981]" : "bg-[#3f3f3f]"
                    )}>
                      {step.completed && <CheckIcon className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-xs text-white/90 text-center leading-tight mb-1">{step.label}</span>
                    <span className="text-[10px] text-white/40">{step.completed ? step.date : '--'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 bg-[#1f1f1f] rounded-xl p-4 w-full">
              <p className="text-xs text-white/50 text-center leading-relaxed">
                The recipient account is expected to be credited within 5 minutes, subject to notification by the bank.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-[#242424] rounded-2xl p-6">
            <h3 className="text-white font-semibold text-lg mb-6">Transaction Details</h3>
            
            <div className="space-y-5">
              <div className="flex justify-between items-start gap-4">
                <span className="text-white/50 text-sm whitespace-nowrap">Recipient Details</span>
                <div className="text-right flex flex-col">
                  <span className="text-white text-sm">
                    {transaction.recipientDetails?.fullName || 'N/A'}
                  </span>
                  <span className="text-white/70 text-xs mt-1">
                    {transaction.recipientDetails?.bankName || 'SWENTRA VAULT'} | {transaction.recipientDetails?.accountNumber || ''}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Transaction No.</span>
                <div className="flex items-center gap-2 text-white text-sm">
                  {transaction.id}
                  <button onClick={() => copyToClipboard(transaction.id)} className="text-white/40 hover:text-white">
                    <CopyIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Payment Method</span>
                <div className="flex items-center gap-1 text-white text-sm">
                  {paymentMethod}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Transaction Date</span>
                <span className="text-white text-sm">{formatDate(transaction.createdAt)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Session ID</span>
                <div className="flex items-center gap-2 text-white text-sm">
                  {transaction.sessionId || 'N/A'}
                  {transaction.sessionId && (
                    <button onClick={() => copyToClipboard(transaction.sessionId)} className="text-white/40 hover:text-white">
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 pb-8">
            <Button variant="outline" className="flex-1 bg-[#1a2e26] text-[#10b981] border-none hover:bg-[#1a2e26]/80 rounded-full h-12 text-base font-semibold">
              Report Issue
            </Button>
            <Button className="flex-1 bg-[#10b981] text-white hover:bg-[#10b981]/90 rounded-full h-12 text-base font-semibold" onClick={() => toast.success('Receipt download started')}>
              Share Receipt
            </Button>
          </div>
          
        </div>
      </SheetContent>
    </Sheet>
  )
}
