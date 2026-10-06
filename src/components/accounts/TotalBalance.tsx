import { motion } from 'motion/react'
import { formatCurrency, type BankAccount } from '@/types/accounts'

interface TotalBalanceProps {
  accounts: BankAccount[]
}

// Temporary hardcoded conversion rates for the prototype
const CHF_RATES = {
  CHF: 1,
  USD: 0.89, // 1 USD = 0.89 CHF
  EUR: 0.96, // 1 EUR = 0.96 CHF
  NGN: 0.00065, // 1 NGN = 0.00065 CHF
}

export function TotalBalance({ accounts }: TotalBalanceProps) {
  // Aggregate all available balances into CHF equivalent
  const totalInChf = accounts.reduce((acc, account) => {
    return acc + (account.availableBalance || 0) * (CHF_RATES[account.currency] || 0)
  }, 0)

  return (
    <div className="flex flex-col space-y-1">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Total Available Funds
      </h2>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-baseline gap-2"
      >
        <span className="font-mono text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          {formatCurrency(totalInChf, 'CHF')}
        </span>
        {accounts.length === 0 && (
          <span className="ml-2 rounded border border-warning/20 bg-warning/10 px-2 py-0.5 text-xs text-warning">
            PROVISIONING
          </span>
        )}
      </motion.div>
    </div>
  )
}
