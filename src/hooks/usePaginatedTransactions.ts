import { useCallback, useEffect, useRef, useState } from 'react'
import {
  collection,
  collectionGroup,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
  getCountFromServer,
  Timestamp,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export const PAGE_SIZE = 12

export interface DateRange {
  from: Date | null
  to: Date | null
}

export interface PaginatedDoc {
  id: string
  uid?: string
  data: any
}

interface Options {
  /** 'user' → users/{uid}/transactions ; 'all' → collectionGroup('transactions') */
  scope: 'user' | 'all'
  uid?: string
  range?: DateRange
  /** Admin ledger shows a total count (count() ≈ 1 read per 1,000 rows). */
  withCount?: boolean
}

function dayStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function nextDayStart(d: Date): Date {
  const x = dayStart(d)
  x.setDate(x.getDate() + 1)
  return x
}

function dayKey(d: Date): string {
  return dayStart(d).toISOString().slice(0, 10)
}

function buildBase(scope: 'user' | 'all', uid: string | undefined, range: DateRange | undefined): Query {
  const base =
    scope === 'user'
      ? collection(db, `users/${uid}/transactions`)
      : collectionGroup(db, 'transactions')

  const constraints: any[] = [orderBy('createdAt', 'desc')]
  if (range?.from) constraints.push(where('createdAt', '>=', Timestamp.fromDate(dayStart(range.from))))
  if (range?.to) constraints.push(where('createdAt', '<', Timestamp.fromDate(nextDayStart(range.to))))
  return query(base, ...constraints)
}

/**
 * Cursor-based pagination (12/page) with an optional server-side date range and
 * an optional total count. Reads are bounded to PAGE_SIZE documents per page;
 * visited pages are cached in memory so prev/next costs no extra reads.
 *
 * Uses cursors (startAfter) — NOT offsets — because Firestore bills a read for
 * every document an offset skips.
 */
export function usePaginatedTransactions({ scope, uid, range, withCount = false }: Options) {
  const key = `${scope}|${uid ?? ''}|${range?.from ? dayKey(range.from) : ''}|${range?.to ? dayKey(range.to) : ''}`

  const pages = useRef(new Map<string, PaginatedDoc[]>())
  const metas = useRef(new Map<string, { hasNext: boolean }>())
  const lastDocs = useRef(new Map<string, QueryDocumentSnapshot>())

  const [pageIndex, setPageIndex] = useState(0)
  const [docs, setDocs] = useState<PaginatedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [hasNext, setHasNext] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const [nonce, setNonce] = useState(0)

  // Reset to first page whenever the query key (scope/uid/date range) changes.
  useEffect(() => {
    setPageIndex(0)
  }, [key])

  useEffect(() => {
    let cancelled = false
    const cacheKey = `${key}:${pageIndex}`

    const cached = pages.current.get(cacheKey)
    if (cached) {
      setDocs(cached)
      setHasNext(metas.current.get(cacheKey)?.hasNext ?? false)
      setLoading(false)
      return
    }

    async function run() {
      setLoading(true)
      try {
        const after = pageIndex === 0 ? undefined : lastDocs.current.get(`${key}:${pageIndex - 1}`)
        const constraints: any[] = []
        if (after) constraints.push(startAfter(after))
        constraints.push(limit(PAGE_SIZE))
        const q = query(buildBase(scope, uid, range), ...constraints)
        const snap = await getDocs(q)
        if (cancelled) return

        const mapped: PaginatedDoc[] = snap.docs.map((d) => ({
          id: d.id,
          uid: scope === 'all' ? d.ref.parent.parent?.id : uid,
          data: d.data(),
        }))

        const more = snap.docs.length === PAGE_SIZE
        pages.current.set(cacheKey, mapped)
        metas.current.set(cacheKey, { hasNext: more })
        if (snap.docs.length > 0) {
          lastDocs.current.set(`${key}:${pageIndex}`, snap.docs[snap.docs.length - 1])
        }
        setDocs(mapped)
        setHasNext(more)
      } catch (error) {
        console.error('[paginated] fetch failed:', error)
        if (!cancelled) {
          setDocs([])
          setHasNext(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pageIndex, scope, uid, range?.from, range?.to, nonce])

  // Optional total count for the current filter (cheap; ~1 read / 1,000 rows).
  useEffect(() => {
    if (!withCount) {
      setCount(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const baseConstraints: any[] = [orderBy('createdAt', 'desc')]
        if (range?.from) baseConstraints.push(where('createdAt', '>=', Timestamp.fromDate(dayStart(range.from))))
        if (range?.to) baseConstraints.push(where('createdAt', '<', Timestamp.fromDate(nextDayStart(range.to))))
        // getCountFromServer ignores limit/startAfter; build a plain filtered query.
        const countQuery = query(
          scope === 'user' ? collection(db, `users/${uid}/transactions`) : collectionGroup(db, 'transactions'),
          ...baseConstraints,
        )
        const snap = await getCountFromServer(countQuery)
        if (!cancelled) setCount(snap.data().count)
      } catch (error) {
        console.error('[paginated] count failed:', error)
        if (!cancelled) setCount(null)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, withCount, scope, uid, range?.from, range?.to])

  const next = useCallback(() => {
    setPageIndex((i) => (metas.current.get(`${key}:${i}`)?.hasNext ? i + 1 : i))
  }, [key])

  const prev = useCallback(() => setPageIndex((i) => Math.max(0, i - 1)), [])

  /** Drop cached pages for the current filter and re-read the active page. */
  const refetch = useCallback(() => {
    for (const k of Array.from(pages.current.keys())) if (k.startsWith(`${key}:`)) pages.current.delete(k)
    for (const k of Array.from(metas.current.keys())) if (k.startsWith(`${key}:`)) metas.current.delete(k)
    for (const k of Array.from(lastDocs.current.keys())) if (k.startsWith(`${key}:`)) lastDocs.current.delete(k)
    setNonce((n) => n + 1)
  }, [key])

  return { docs, loading, hasNext, count, pageIndex, next, prev, canPrev: pageIndex > 0, refetch }
}