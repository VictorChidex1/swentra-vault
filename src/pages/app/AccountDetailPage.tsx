import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  DownloadIcon, 
  SendIcon,
  ArrowUpRightIcon, 
  ArrowDownLeftIcon, 
  Loader2Icon 
} from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency, type CurrencyCode } from '@/types/accounts'
import { useTransactions } from '@/hooks/useTransactions'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/transactions'
import { TransactionDrawer } from '@/components/transactions/TransactionDrawer'

function formatDateShort(dateStr: unknown) {
  if (!dateStr) return ''
  const date = (dateStr as any).toDate ? (dateStr as any).toDate() : new Date(dateStr as string)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { accounts, loading } = useAccounts()
  const { transactions, loading: txLoading } = useTransactions()
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const account = accounts.find((a) => a.id === id)
  
  const accountTransactions = transactions.filter(
    tx => tx.sourceAccountId === account?.id || tx.currency === account?.currency
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <div className="h-64 animate-pulse rounded-xl border border-border bg-surface/50" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <p className="font-mono text-muted-foreground">ACCOUNT NOT FOUND</p>
        <Link to="/app/accounts" className="mt-4 text-sm text-primary hover:underline">
          Return to Accounts
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/app/accounts"
            className="flex size-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-surface"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight text-foreground">
                {account.currency} {account.type.toUpperCase()}
              </h1>
              <span className="rounded bg-surface px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                {account.status}
              </span>
            </div>
            <p className="font-mono text-sm text-muted-foreground">
              {account.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-surface">
            <DownloadIcon className="size-4" />
            Statement
          </button>
          <Link
            to="/app/transfer"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <SendIcon className="size-4" />
            Transfer
          </Link>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Available to spend
          </p>
          <p className="mt-2 font-mono text-4xl text-foreground">
            {formatCurrency(account.availableBalance, account.currency)}
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Transaction History
          </h3>
          <Link to="/app/transactions" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </div>
        
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {txLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : accountTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                NO TRANSACTIONS FOUND
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                There is no recent activity on this account.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {accountTransactions.map(tx => {
                const isOutgoing = tx.amount < 0
                return (
                  <button 
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between hover:bg-surface/50 transition-colors cursor-pointer"
                  >
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
                          <span className="uppercase tracking-wider">{formatDateShort(tx.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-mono text-base",
                        isOutgoing ? "text-foreground" : "text-primary"
                      )}>
                        {formatCurrency(tx.amount, tx.currency as CurrencyCode)}
                      </div>
                      <div className="mt-1">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-medium tracking-wide uppercase",
                          tx.status === 'COMPLETED' && "text-primary",
                          tx.status === 'PROCESSING' && "text-secondary-foreground",
                          tx.status === 'PENDING' && "text-muted-foreground",
                          tx.status === 'FAILED' && "text-destructive"
                        )}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <TransactionDrawer transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
