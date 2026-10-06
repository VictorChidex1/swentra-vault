import { cn } from '@/lib/utils'

export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'muted'

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
}

interface TerminalStatusProps {
  label: string
  tone?: StatusTone
  className?: string
}

/**
 * A semantic status indicator (dot + label).
 * Status must reflect real application state; never render a state the
 * system is not actually in.
 */
export function TerminalStatus({
  label,
  tone = 'success',
  className,
}: TerminalStatusProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-xs',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
