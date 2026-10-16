import { CalendarIcon, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { DateRange } from '@/hooks/usePaginatedTransactions'

function toInput(d: Date | null): string {
  if (!d) return ''
  const x = new Date(d)
  const local = new Date(x.getTime() - x.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function fromInput(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const PRESETS: { label: string; get: () => DateRange }[] = [
  { label: 'Today', get: () => { const d = new Date(); return { from: d, to: d } } },
  { label: 'Yesterday', get: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: d, to: d } } },
  { label: 'Last 7 days', get: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 6); return { from, to } } },
  { label: 'This month', get: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1), to: n } } },
]

interface DateRangeFilterProps {
  range: DateRange
  onChange: (range: DateRange) => void
}

/** Server-side date range (translates to createdAt range constraints — cheap). */
export function DateRangeFilter({ range, onChange }: DateRangeFilterProps) {
  const active = !!(range.from || range.to)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          type="date"
          aria-label="From date"
          value={toInput(range.from)}
          max={toInput(range.to) || undefined}
          onChange={(e) => onChange({ ...range, from: fromInput(e.target.value) })}
          className="h-9 w-[148px]"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To date"
          value={toInput(range.to)}
          min={toInput(range.from) || undefined}
          onChange={(e) => onChange({ ...range, to: fromInput(e.target.value) })}
          className="h-9 w-[148px]"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.get())}
            className="px-2.5 py-1.5 text-xs font-medium rounded-full border border-border bg-surface text-muted-foreground whitespace-nowrap transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {p.label}
          </button>
        ))}
      </div>

      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ from: null, to: null })}>
          <XIcon className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}