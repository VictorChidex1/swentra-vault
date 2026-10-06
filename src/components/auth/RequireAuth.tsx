import { Navigate, useLocation } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface RequireAuthProps {
  children: React.ReactNode
  requireVerified?: boolean
}

export function RequireAuth({
  children,
  requireVerified = true,
}: RequireAuthProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireVerified && !user.emailVerified) {
    return <Navigate to="/verify-email?pending=true" replace />
  }

  return <>{children}</>
}