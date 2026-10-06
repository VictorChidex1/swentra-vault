import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface TerminalSectionProps {
  label: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

/** A labelled section with a rule, used to structure terminal pages. */
export function TerminalSection({
  label,
  children,
  action,
  className,
}: TerminalSectionProps) {
  return (
    <section className={cn('w-full', className)}>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
          {label}
        </h2>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        {action}
      </div>
      {children}
    </section>
  )
}
