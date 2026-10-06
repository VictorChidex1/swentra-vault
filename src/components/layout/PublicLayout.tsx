import { Outlet } from 'react-router-dom'

import { PublicFooter } from '@/components/navigation/PublicFooter'
import { PublicHeader } from '@/components/navigation/PublicHeader'

export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
