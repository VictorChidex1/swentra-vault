import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, DownloadIcon, SendIcon } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/types/accounts'

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { accounts, loading } = useAccounts()

  const account = accounts.find((a) => a.id === id)

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
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Current Balance
            </p>
            <p className="mt-2 font-mono text-4xl text-foreground">
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>
          <div className="border-t border-border pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Available to spend
            </p>
            <p className="mt-2 font-mono text-2xl text-foreground">
              {formatCurrency(account.availableBalance, account.currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Excludes pending authorizations and reserved funds.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History (Placeholder for Phase 6) */}
      <div className="space-y-4">
        <h3 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          Transaction History
        </h3>
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              NO TRANSACTIONS FOUND
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              There is no recent activity on this account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
