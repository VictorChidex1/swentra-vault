import { motion } from 'motion/react'
import { MoreHorizontalIcon, ArrowRightLeftIcon } from 'lucide-react'
import { formatCurrency, type BankAccount } from '@/types/accounts'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useKyc } from '@/hooks/useKyc'

interface AccountCardProps {
  account: BankAccount
}

export function AccountCard({ account }: AccountCardProps) {
  const { user } = useAuth()
  const { record: kycRecord } = useKyc()
  
  // Determine gradient/accents based on currency
  let gradientClass = ''
  let badgeClass = ''

  switch (account.currency) {
    case 'CHF':
      gradientClass = 'from-emerald-500/10 to-emerald-900/5 border-emerald-500/20'
      badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      break
    case 'USD':
      gradientClass = 'from-blue-500/10 to-blue-900/5 border-blue-500/20'
      badgeClass = 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      break
    case 'EUR':
      gradientClass = 'from-indigo-500/10 to-indigo-900/5 border-indigo-500/20'
      badgeClass = 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
      break
    case 'NGN':
      gradientClass = 'from-emerald-600/5 to-emerald-900/5 border-emerald-600/10'
      badgeClass = 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20'
      break
  }

  // Format account number nicely: 849201847291 -> 8492 0184 7291
  const formattedNumber = account.accountNumber.replace(/(\d{4})/g, '$1 ').trim()
  
  const kycName = kycRecord?.personalDetails 
    ? `${kycRecord.personalDetails.firstName} ${kycRecord.personalDetails.lastName}`.trim()
    : null
  
  const accountName = kycName || user?.displayName || 'Vault Client'

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card
        className={`group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-md ${gradientClass}`}
      >
        <div className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-bl-lg bg-surface/50 p-2 backdrop-blur-sm">
            <MoreHorizontalIcon className="size-4 text-muted-foreground" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-sm font-medium tracking-widest text-foreground">
              {account.currency} {account.type.toUpperCase()}
            </h3>
            <div
              className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border ${badgeClass}`}
            >
              {account.status}
            </div>
          </div>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest text-foreground/80">
            {accountName}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {formattedNumber}
          </p>
        </div>

        <div className="mt-8">
          <p className="font-mono text-2xl text-foreground">
            {formatCurrency(account.availableBalance, account.currency)}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowRightLeftIcon className="size-3" />
            <span>Settled Ledger: {formatCurrency(account.balance, account.currency)}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
