export interface NavItem {
  index: string
  label: string
  to: string
}

/** Customer navigation, ordered per the project specification. */
export const CUSTOMER_NAV: NavItem[] = [
  { index: '01', label: 'Overview', to: '/app' },
  { index: '02', label: 'Accounts', to: '/app/accounts' },
  { index: '03', label: 'Transfer', to: '/app/transfer' },
  { index: '04', label: 'Beneficiaries', to: '/app/beneficiaries' },
  { index: '05', label: 'Transactions', to: '/app/transactions' },
  { index: '06', label: 'Receipts', to: '/app/receipts' },
  { index: '07', label: 'Security', to: '/app/security' },
  { index: '08', label: 'KYC', to: '/app/kyc' },
  { index: '09', label: 'Settings', to: '/app/settings' },
  { index: '10', label: 'Support', to: '/app/support' },
]

const TITLES: Array<[string, string]> = [
  ['/app/accounts', 'Accounts'],
  ['/app/transfer', 'Transfer'],
  ['/app/beneficiaries', 'Beneficiaries'],
  ['/app/transactions', 'Transactions'],
  ['/app/receipts', 'Receipts'],
  ['/app/security', 'Security'],
  ['/app/kyc', 'KYC'],
  ['/app/settings', 'Settings'],
  ['/app/support', 'Support'],
  ['/app', 'Overview'],
]

/** Resolve a plain-language page title for the shell header from a pathname. */
export function titleForPath(pathname: string): string {
  for (const [prefix, title] of TITLES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title
    }
  }
  return 'Swentra Vault'
}
