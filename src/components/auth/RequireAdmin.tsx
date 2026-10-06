import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";

export function RequireAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult(true).then((idTokenResult) => {
        setIsAdmin(!!idTokenResult.claims.admin);
      }).catch((err) => {
        console.error("Failed to get token result", err);
        setIsAdmin(false);
      });
    } else if (!loading) {
      setIsAdmin(false);
    }
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
