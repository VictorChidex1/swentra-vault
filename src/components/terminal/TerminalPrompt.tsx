import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface TerminalPromptProps {
  children: ReactNode
  className?: string
}

/**
 * A plain, low-emphasis caption line.
 * Swentra's terminal is a visual identity, not a command line, so this carries
 * plain language rather than shell syntax.
 */
export function TerminalPrompt({ children, className }: TerminalPromptProps) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>{children}</p>
  )
}
