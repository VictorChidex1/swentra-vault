import { Navigate, useLocation } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface RedirectIfAuthProps {
  children: React.ReactNode
}

export function RedirectIfAuth({ children }: RedirectIfAuthProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/app'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}