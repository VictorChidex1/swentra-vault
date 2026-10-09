import { Outlet } from 'react-router-dom'

import { PublicFooter } from '@/components/navigation/PublicFooter'
import { PublicHeader } from '@/components/navigation/PublicHeader'

import { SystemErrorBoundary } from '@/components/error/SystemErrorBoundary'

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <SystemErrorBoundary level="page">
          <Outlet />
        </SystemErrorBoundary>
      </main>
      <PublicFooter />
    </div>
  )
}
