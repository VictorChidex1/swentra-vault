import type { ReactNode } from 'react'

import { MobileNavigation } from '@/components/navigation/MobileNavigation'
import { Sidebar } from '@/components/navigation/Sidebar'
import { TerminalHeader } from '@/components/terminal/TerminalFrame'

interface TerminalShellProps {
  title: string
  children: ReactNode
}

function today(): string {
  return new Date()
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    .toUpperCase()
}

/**
 * Authenticated application shell: window frame, header, sidebar, content and
 * mobile navigation. Pages render inside `children` and must not recreate it.
 */
export function TerminalShell({ title, children }: TerminalShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TerminalHeader
        title={`Swentra Vault — ${title}`}
        meta={today()}
        className="shrink-0"
      />
      <div className="flex flex-1">
        <Sidebar className="hidden lg:flex" />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">
            {children}
          </div>
        </main>
      </div>
      <MobileNavigation className="lg:hidden" />
    </div>
  )
}
