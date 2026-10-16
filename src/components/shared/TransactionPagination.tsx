import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TransactionPaginationProps {
  pageIndex: number
  hasNext: boolean
  canPrev: boolean
  onPrev: () => void
  onNext: () => void
  count?: number | null
}

/** Prev/Next cursor pagination (12/page by default). No numeric page jumps —
 * those require offsets, which Firestore bills per skipped document. */
export function TransactionPagination({
  pageIndex,
  hasNext,
  canPrev,
  onPrev,
  onNext,
  count,
}: TransactionPaginationProps) {
  if (!canPrev && !hasNext) return null

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border">
      <span className="text-xs text-muted-foreground">
        Page {pageIndex + 1}
        {count != null ? ` · ${count.toLocaleString()} total` : ''}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!canPrev}>
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>
          Next
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}