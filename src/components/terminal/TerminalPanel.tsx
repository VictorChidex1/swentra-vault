import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface TerminalPanelProps {
  children: ReactNode
  className?: string
}

/** A bordered surface used to group terminal content. */
export function TerminalPanel({ children, className }: TerminalPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
