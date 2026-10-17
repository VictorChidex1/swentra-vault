import { useEffect, useRef } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/types/accounts'
import { toast } from 'sonner'

/**
 * Global in-app notifier: watches the user's latest transactions and shows a
 * toast when a NEW incoming transfer arrives. Bounded (limit 5) so it costs a
 * handful of reads, only on change.
 */
export function IncomingTransferNotifier() {
  const { user } = useAuth()
  const seen = useRef<Set<string>>(new Set())
  const seeded = useRef(false)

  useEffect(() => {
    if (!user) return
    seen.current = new Set()
    seeded.current = false

    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy('createdAt', 'desc'),
      limit(5),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as any[]

      // First snapshot: seed without notifying (these are pre-existing).
      if (!seeded.current) {
        docs.forEach((d) => seen.current.add(d.id))
        seeded.current = true
        return
      }

      for (const d of docs) {
        if (seen.current.has(d.id)) continue
        seen.current.add(d.id)
        if (d.type === 'INCOMING_TRANSFER') {
          toast.success(`You received ${formatCurrency(Math.abs(d.amount || 0), d.currency)}`)
        }
      }
    })

    return () => unsubscribe()
  }, [user])

  return null
}