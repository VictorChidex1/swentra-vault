import { MotionConfig } from "motion/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RedirectIfAuth } from "@/components/auth/RedirectIfAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import AppLayout from "@/components/layout/AppLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { Toaster } from "@/components/ui/sonner";
import AboutPage from "@/pages/public/AboutPage";
import HomePage from "@/pages/public/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import PrivacyPage from "@/pages/public/PrivacyPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import SecurityPage from "@/pages/public/SecurityPage";
import TermsPage from "@/pages/public/TermsPage";
import KycPage from "@/pages/app/KycPage";
import DashboardPage from "@/pages/app/DashboardPage";
import AccountsPage from "@/pages/app/AccountsPage";
import AccountDetailPage from "@/pages/app/AccountDetailPage";
import SettingsPage from "@/pages/app/SettingsPage";
import BeneficiariesPage from "@/pages/app/BeneficiariesPage";
import TransferPage from "@/pages/app/TransferPage";
import TransactionsPage from "@/pages/app/TransactionsPage";
import BootstrapAdminPage from "@/pages/admin/BootstrapAdmin";
import OverviewPage from "@/pages/admin/OverviewPage";
import FundingPortalPage from "@/pages/admin/FundingPortalPage";
import AdminTransactionsPage from "@/pages/admin/TransactionsPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";
import KycReviewPage from "@/pages/admin/KycReviewPage";
import UsersPage from "@/pages/admin/UsersPage";
import Placeholder from "@/pages/Placeholder";

const CUSTOMER_ROUTES = ["/app/receipts", "/app/security", "/app/support"];

const TRANSFER_STATE_ROUTES = [
  "/app/transfer/review",
  "/app/transfer/authorize",
  "/app/transfer/processing",
  "/app/transfer/success",
  "/app/transfer/failed",
];

const ADMIN_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/accounts",
  "/admin/kyc",
  "/admin/transactions",
  "/admin/funding",
  "/admin/settings",
  "/admin/fees",
  "/admin/exchange-rates",
  "/admin/audit",
  "/admin/security",
];

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

            <Route
              path="/login"
              element={
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              }
            />
            <Route
              path="/register"
              element={
                <RedirectIfAuth>
                  <RegisterPage />
                </RedirectIfAuth>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              {[...CUSTOMER_ROUTES, ...TRANSFER_STATE_ROUTES].map((path) => (
                <Route
                  key={path}
                  path={path}
                  element={<Placeholder path={path} />}
                />
              ))}
              <Route path="/app" element={<DashboardPage />} />
              <Route path="/app/accounts" element={<AccountsPage />} />
              <Route path="/app/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/app/kyc" element={<KycPage />} />
              <Route path="/app/settings" element={<SettingsPage />} />
              <Route
                path="/app/beneficiaries"
                element={<BeneficiariesPage />}
              />
              <Route path="/app/transfer" element={<TransferPage />} />
              <Route path="/app/transactions" element={<TransactionsPage />} />
              <Route path="/bootstrap-admin" element={<BootstrapAdminPage />} />
            </Route>

            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                {ADMIN_ROUTES.map((path) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      path === "/admin" ? <OverviewPage /> :
                      path === "/admin/kyc" ? <KycReviewPage /> :
                      path === "/admin/users" ? <UsersPage /> :
                      path === "/admin/funding" ? <FundingPortalPage /> :
                      path === "/admin/transactions" ? <AdminTransactionsPage /> :
                      path === "/admin/settings" ? <AdminSettingsPage /> :
                      <Placeholder path={path} />
                    }
                  />
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Placeholder path="404 — not found" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
