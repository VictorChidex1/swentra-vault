import { cn } from '@/lib/utils'

interface TerminalCursorProps {
  className?: string
}

/** A blinking block cursor. Animation is suppressed under reduced motion. */
export function TerminalCursor({ className }: TerminalCursorProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block h-[1em] w-[0.55em] translate-y-[0.1em] bg-primary align-middle motion-safe:animate-pulse',
        className,
      )}
    />
  )
}
