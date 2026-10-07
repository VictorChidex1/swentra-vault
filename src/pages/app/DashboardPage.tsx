import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, RefreshCwIcon, SendIcon } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { useKyc } from '@/hooks/useKyc'
import { TotalBalance } from '@/components/accounts/TotalBalance'
import { AccountCard } from '@/components/accounts/AccountCard'
import { SecurityStateCard } from '@/components/accounts/SecurityStateCard'
import { KycStatusCard } from '@/components/kyc/KycStatusCard'
import { useTransactions } from '@/hooks/useTransactions'
import { ArrowUpRightIcon, ArrowDownLeftIcon } from 'lucide-react'
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

function formatDateShort(dateStr: any) {
  if (!dateStr) return ''
  const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}
export default function DashboardPage() {
  const { accounts, loading: accountsLoading } = useAccounts()
  const { record: kycRecord, status: kycStatus } = useKyc()
  const { transactions, loading: txLoading } = useTransactions()
  const recentTransactions = transactions.slice(0, 4)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  return (
    <div className="mx-auto max-w-5xl py-6 space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <TotalBalance accounts={accounts} />
        
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <SecurityStateCard />
          <div className="flex gap-2">
            <Link
              to="/app/transfer"
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:flex-none"
            >
              <SendIcon className="size-4" />
              Transfer
            </Link>
            <Link
              to="/app/exchange"
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-surface md:flex-none"
            >
              <RefreshCwIcon className="size-4" />
              Exchange
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (Accounts) */}
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Currency Accounts
            </h3>
            <Link
              to="/app/accounts"
              className="group flex items-center gap-1 font-mono text-xs text-primary transition-colors hover:text-primary/80"
            >
              VIEW ALL <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {accountsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 rounded-xl border border-border bg-surface/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map((account) => (
                <Link key={account.id} to={`/app/accounts/${account.id}`}>
                  <AccountCard account={account} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (Status & Activity) */}
        <div className="space-y-6">
          <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Action Center
          </h3>

          {/* KYC Status Widget */}
          {kycStatus !== 'VERIFIED' && kycRecord && (
            <Link to="/app/kyc" className="block transition-transform hover:scale-[1.02]">
              <KycStatusCard record={kycRecord} />
            </Link>
          )}

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4 flex items-center justify-between">
              <h4 className="font-mono text-sm font-medium text-foreground">
                Recent Activity
              </h4>
              <Link to="/app/transactions" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-mono text-xs text-muted-foreground">
                  NO RECENT TRANSACTIONS
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Your vault activity will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map(tx => {
                  const isOutgoing = tx.amount < 0
                  return (
                    <button 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-surface/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex size-8 items-center justify-center rounded-full shrink-0",
                          isOutgoing ? "bg-secondary/20 text-muted-foreground" : "bg-primary/20 text-primary"
                        )}>
                          {isOutgoing ? <ArrowUpRightIcon className="size-4" /> : <ArrowDownLeftIcon className="size-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-foreground">
                            {isOutgoing ? `To ${tx.recipientDetails?.fullName || 'Account'}` : `From ${tx.sourceDetails?.senderName || 'Account'}`}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                            {formatDateShort(tx.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-mono text-sm",
                          isOutgoing ? "text-foreground" : "text-primary"
                        )}>
                          {formatAmount(tx.amount, tx.currency)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <TransactionDrawer transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
