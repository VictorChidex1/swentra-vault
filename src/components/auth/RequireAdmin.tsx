import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

export function RequireAdmin() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false
    if (user) {
      // Use the cached token first (instant); only force a refresh when the
      // cached claim is missing — e.g. a role that was just granted.
      user
        .getIdTokenResult()
        .then(async (res) => {
          if (res.claims.admin) return true
          const fresh = await user.getIdTokenResult(true)
          return !!fresh.claims.admin
        })
        .then((isAdminResult) => {
          if (!cancelled) setIsAdmin(isAdminResult)
        })
        .catch((err) => {
          console.error("Failed to get token result", err)
          if (!cancelled) setIsAdmin(false)
        })
    } else if (!loading) {
      setIsAdmin(false)
    }
    return () => {
      cancelled = true
    }
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination so a deep link to /admin survives login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // Authenticated but not an admin.
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
