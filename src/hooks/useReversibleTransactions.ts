import { useMemo } from 'react'
import { collectionGroup, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'

export interface ReversibleTx {
  id: string
  uid: string
  email: string
  amount: number
  currency: string
  type: string
  status: string
  reference: string
  createdAt: any
  recipientDetails?: {
    fullName?: string
    bankName?: string
    accountNumber?: string
  }
}

export interface ReverseTarget {
  uid: string
  transactionId: string
  reference: string
  amount: number
  currency: string
  email?: string
}

interface AdminUserRecord {
  uid: string
  email: string
  admin?: boolean
}

// Only genuine client transfers are reversible: their internal self-transfers
// (INTERNAL_TRANSFER) and admin/system ledger entries are intentionally excluded.
const ELIGIBLE_TYPES = ['SWENTRA_TRANSFER', 'EXTERNAL_WIRE']

export function toReverseTarget(tx: ReversibleTx): ReverseTarget {
  return {
    uid: tx.uid,
    transactionId: tx.id,
    reference: tx.reference,
    amount: tx.amount,
    currency: tx.currency,
    email: tx.email,
  }
}

export function formatRelativeTime(value: any): string {
  if (!value) return ''
  const date = value.toDate ? value.toDate() : new Date(value)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * Recent transactions eligible for admin reversal:
 * outgoing, not FAILED, not already reversed, owned by a non-admin user, and
 * of a reversible type. Shared by the dashboard widget, the picker, and the
 * dedicated Reversals page.
 */
export function useReversibleTransactions(limitCount = 200) {
  const usersFetcher = useMemo(() => async () => {
    const adminListUsers = httpsCallable<void, { users: AdminUserRecord[] }>(functions, 'adminListUsers')
    return (await adminListUsers()).data.users
  }, [])
  const { data: users } = useAdminCache('admin-users', usersFetcher)

  const txFetcher = useMemo(() => async () => {
    const q = query(
      collectionGroup(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => {
      const uid = doc.ref.parent.parent?.id || ''
      return { id: doc.id, uid, ...doc.data() } as any
    })
  }, [limitCount])
  const { data, loading, refetch } = useAdminCache<any[]>(`admin-reversible-${limitCount}`, txFetcher)

  const userMap = useMemo(() => {
    const map = new Map<string, AdminUserRecord>()
    ;(users || []).forEach((u) => map.set(u.uid, u))
    return map
  }, [users])

  const transactions = useMemo<ReversibleTx[]>(() => {
    return (data || [])
      .filter((t) => {
        if (t.amount >= 0) return false // outgoing only
        if (t.status === 'FAILED') return false
        if (t.reversed) return false
        if (!t.sourceAccountId) return false
        if (!ELIGIBLE_TYPES.includes(t.type)) return false
        // Exclude treasury/system ledger entries (master accounts, mint).
        const src = String(t.sourceAccountId)
        if (src === 'MINT' || src.startsWith('system-')) return false
        return true
      })
      .map((t) => ({
        id: t.id,
        uid: t.uid,
        email: userMap.get(t.uid)?.email || 'Unknown User',
        amount: t.amount,
        currency: t.currency,
        type: t.type,
        status: t.status,
        reference: t.reference || 'Transaction',
        createdAt: t.createdAt ?? t.timestamp,
        recipientDetails: t.recipientDetails,
      }))
  }, [data, userMap])

  return { transactions, loading, refetch }
}