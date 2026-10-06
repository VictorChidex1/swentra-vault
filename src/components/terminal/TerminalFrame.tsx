import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface TerminalFrameProps {
  children: ReactNode
  className?: string
}

/**
 * The macOS-window-style frame that wraps terminal surfaces.
 * The traffic-light dots are decorative brand elements, not real controls.
 */
export function TerminalFrame({ children, className }: TerminalFrameProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function TrafficLights({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-1.5', className)} aria-hidden="true">
      <span className="size-2.5 rounded-full bg-[#ff5f56]" />
      <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
      <span className="size-2.5 rounded-full bg-[#27c93f]" />
    </span>
  )
}

interface TerminalHeaderProps {
  title: string
  meta?: ReactNode
  className?: string
}

/** Title bar for a terminal frame. `title` is plain language, not a shell path. */
export function TerminalHeader({ title, meta, className }: TerminalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-2.5',
        className,
      )}
    >
      <TrafficLights />
      <span className="truncate text-xs text-muted-foreground">{title}</span>
      {meta ? (
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {meta}
        </span>
      ) : null}
    </div>
  )
}
