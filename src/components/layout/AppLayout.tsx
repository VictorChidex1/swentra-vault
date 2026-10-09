import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

import { titleForPath } from '@/components/navigation/nav-items'
import { TerminalShell } from '@/components/terminal/TerminalShell'
import { useIdleTimeout } from '@/hooks/useIdleTimeout'
import { useAuth } from '@/hooks/useAuth'

import { SystemErrorBoundary } from '@/components/error/SystemErrorBoundary'

export default function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleIdle = useCallback(async () => {
    try {
      await signOut()
      // We could add a toast here, but user asked for strict silent logout
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Failed to log out on idle:', err)
    }
  }, [signOut, navigate])

  // 15 minutes of inactivity triggers a silent logout
  useIdleTimeout(handleIdle, 15)

  return (
    <TerminalShell title={titleForPath(pathname)}>
      <SystemErrorBoundary level="page">
        <Outlet />
      </SystemErrorBoundary>
    </TerminalShell>
  )
}
