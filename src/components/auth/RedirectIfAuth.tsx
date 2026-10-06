import { Navigate } from 'react-router-dom'
import { Loader2Icon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface RedirectIfAuthProps {
  children: React.ReactNode
}

export function RedirectIfAuth({ children }: RedirectIfAuthProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}