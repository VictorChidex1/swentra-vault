import { Link } from 'react-router-dom'
import { ArrowRightIcon, RefreshCwIcon, SendIcon } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { useKyc } from '@/hooks/useKyc'
import { TotalBalance } from '@/components/accounts/TotalBalance'
import { AccountCard } from '@/components/accounts/AccountCard'
import { SecurityStateCard } from '@/components/accounts/SecurityStateCard'
import { KycStatusCard } from '@/components/kyc/KycStatusCard'

export default function DashboardPage() {
  const { accounts, loading: accountsLoading } = useAccounts()
  const { record: kycRecord, status: kycStatus } = useKyc()

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

          {/* Recent Activity Placeholder */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h4 className="font-mono text-sm font-medium text-foreground">
                Recent Activity
              </h4>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="font-mono text-xs text-muted-foreground">
                NO RECENT TRANSACTIONS
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Your vault activity will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
