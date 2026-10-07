import type { Timestamp } from 'firebase/firestore'

export type CurrencyCode = 'CHF' | 'USD' | 'EUR' | 'NGN' | 'GBP'

export type AccountType = 'current' | 'reserve'

export type AccountStatus = 'active' | 'frozen' | 'closed'

export interface BankAccount {
  id: string
  ownerId: string
  accountNumber: string
  currency: CurrencyCode
  type: AccountType
  balance: number
  availableBalance: number
  status: AccountStatus
  isSystemAccount?: boolean
  createdAt: Timestamp
}

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  CHF: 'CHF',
  USD: '$',
  EUR: '€',
  NGN: '₦',
  GBP: '£',
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency]
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  if (currency === 'CHF') {
    return `${symbol} ${formattedAmount}`
  }
  return `${symbol}${formattedAmount}`
}
