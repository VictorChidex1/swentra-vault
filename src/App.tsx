import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import AboutPage from '@/pages/public/AboutPage'
import HomePage from '@/pages/public/HomePage'
import PrivacyPage from '@/pages/public/PrivacyPage'
import SecurityPage from '@/pages/public/SecurityPage'
import TermsPage from '@/pages/public/TermsPage'
import Placeholder from '@/pages/Placeholder'

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
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

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Route>

          {AUTH_ROUTES.map((path) => (
            <Route
              key={path}
              path={path}
              element={<Placeholder path={path} />}
            />
          ))}

          <Route element={<AppLayout />}>
            {[...CUSTOMER_ROUTES, ...TRANSFER_STATE_ROUTES].map((path) => (
              <Route
                key={path}
                path={path}
                element={<Placeholder path={path} />}
              />
            ))}
          </Route>

          {ADMIN_ROUTES.map((path) => (
            <Route
              key={path}
              path={path}
              element={<Placeholder path={path} />}
            />
          ))}

          <Route path="*" element={<Placeholder path="404 — not found" />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
