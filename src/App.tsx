import { lazy, Suspense } from "react";
import { MotionConfig } from "motion/react";
import { Loader2Icon } from "lucide-react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RedirectIfAuth } from "@/components/auth/RedirectIfAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import AppLayout from "@/components/layout/AppLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { Toaster } from "@/components/ui/sonner";
import AboutPage from "@/pages/public/AboutPage";
import HomePage from "@/pages/public/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import PrivacyPage from "@/pages/public/PrivacyPage";
import CompliancePage from "@/pages/public/CompliancePage";
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
import AppSecurityPage from "@/pages/app/SecurityPage";
import BeneficiariesPage from "@/pages/app/BeneficiariesPage";
import TransferPage from "@/pages/app/TransferPage";
import TransactionsPage from "@/pages/app/TransactionsPage";
// Admin surface is code-split so its code never bloats the initial bundle.
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout"));
const BootstrapAdminPage = lazy(() => import("@/pages/admin/BootstrapAdmin"));
const OverviewPage = lazy(() => import("@/pages/admin/OverviewPage"));
const FundingPortalPage = lazy(() => import("@/pages/admin/FundingPortalPage"));
const AdminTransactionsPage = lazy(() => import("@/pages/admin/TransactionsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const KycReviewPage = lazy(() => import("@/pages/admin/KycReviewPage"));
const UsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const TreasuryPage = lazy(() => import("@/pages/admin/TreasuryPage"));
const AdminSupportTicketsPage = lazy(() => import("@/pages/admin/SupportTicketsPage"));
const ReversalsPage = lazy(() => import("@/pages/admin/ReversalsPage"));
import ReceiptsPage from "@/pages/app/ReceiptsPage";
import SupportPage from "@/pages/app/SupportPage";
import Placeholder from "@/pages/Placeholder";

const CUSTOMER_ROUTES: string[] = [];

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
  "/admin/treasury",
  "/admin/accounts",
  "/admin/kyc",
  "/admin/transactions",
  "/admin/reversals",
  "/admin/funding",
  "/admin/settings",
  "/admin/support",
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

          <Suspense
            fallback={
              <div className="h-svh flex items-center justify-center bg-background">
                <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
              </div>
            }
          >
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
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
              <Route path="/app/security" element={<AppSecurityPage />} />
              <Route path="/app/support" element={<SupportPage />} />
              <Route
                path="/app/beneficiaries"
                element={<BeneficiariesPage />}
              />
              <Route path="/app/transfer" element={<TransferPage />} />
              <Route path="/app/transactions" element={<TransactionsPage />} />
              <Route path="/app/receipts" element={<ReceiptsPage />} />
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
                      path === "/admin/treasury" ? <TreasuryPage /> :
                      path === "/admin/funding" ? <FundingPortalPage /> :
                      path === "/admin/transactions" ? <AdminTransactionsPage /> :
                      path === "/admin/reversals" ? <ReversalsPage /> :
                      path === "/admin/settings" ? <AdminSettingsPage /> :
                      path === "/admin/support" ? <AdminSupportTicketsPage /> :
                      <Placeholder path={path} />
                    }
                  />
                ))}
              </Route>
            </Route>

            <Route path="*" element={<Placeholder path="404 — not found" />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
