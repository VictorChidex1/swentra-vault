import { Link } from 'react-router-dom'
import { ArrowLeftIcon, SearchIcon } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { AccountCard } from '@/components/accounts/AccountCard'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function AccountsPage() {
  const { accounts, loading } = useAccounts()
  const [search, setSearch] = useState('')

  const filteredAccounts = accounts.filter((acc) =>
    acc.currency.toLowerCase().includes(search.toLowerCase()) ||
    acc.accountNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-5xl py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/app"
          className="flex size-8 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-surface"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            Currency Accounts
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your multi-currency portfolio.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-surface/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <Link key={account.id} to={`/app/accounts/${account.id}`} className="block">
              <AccountCard account={account} />
            </Link>
          ))}
          {filteredAccounts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                No accounts found.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
