import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Placeholder from '@/pages/Placeholder'

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/security',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/terms',
  '/privacy',
]

const CUSTOMER_ROUTES = [
  '/app',
  '/app/accounts',
  '/app/transfer',
  '/app/beneficiaries',
  '/app/transactions',
  '/app/receipts',
  '/app/security',
  '/app/settings',
  '/app/kyc',
  '/app/support',
]

const TRANSFER_STATE_ROUTES = [
  '/app/transfer/review',
  '/app/transfer/authorize',
  '/app/transfer/processing',
  '/app/transfer/success',
  '/app/transfer/failed',
]

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/accounts',
  '/admin/kyc',
  '/admin/transactions',
  '/admin/funding',
  '/admin/fees',
  '/admin/exchange-rates',
  '/admin/audit',
  '/admin/security',
]

const ROUTES = [
  ...PUBLIC_ROUTES,
  ...CUSTOMER_ROUTES,
  ...TRANSFER_STATE_ROUTES,
  ...ADMIN_ROUTES,
]

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {ROUTES.map((path) => (
          <Route key={path} path={path} element={<Placeholder path={path} />} />
        ))}
        <Route path="*" element={<Placeholder path="404 — not found" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
