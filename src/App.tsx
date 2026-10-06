import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/hooks/useAuth'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RedirectIfAuth } from '@/components/auth/RedirectIfAuth'
import AppLayout from '@/components/layout/AppLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import { Toaster } from '@/components/ui/sonner'
import AboutPage from '@/pages/public/AboutPage'
import HomePage from '@/pages/public/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import PrivacyPage from '@/pages/public/PrivacyPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import SecurityPage from '@/pages/public/SecurityPage'
import TermsPage from '@/pages/public/TermsPage'
import Placeholder from '@/pages/Placeholder'

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
        <AuthProvider>
          <Toaster />

          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Route>

            <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
            <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
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
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
