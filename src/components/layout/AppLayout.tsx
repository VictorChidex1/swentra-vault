import { Outlet, useLocation } from 'react-router-dom'

import { titleForPath } from '@/components/navigation/nav-items'
import { TerminalShell } from '@/components/terminal/TerminalShell'

export default function AppLayout() {
  const { pathname } = useLocation()

  return (
    <TerminalShell title={titleForPath(pathname)}>
      <Outlet />
    </TerminalShell>
  )
}
