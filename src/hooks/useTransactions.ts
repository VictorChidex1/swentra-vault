import { useState, useEffect, useRef } from 'react'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'
import type { Transaction } from '@/types/transactions'

// Bounded real-time feed of the user's most recent transactions. Billing is per
// document delivered (initial window + 1 per change), so we keep the window small.
const RECENT_LIMIT = 12

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const seedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    seedRef.current = new Set()

    const q = query(
      collection(db, `users/${user.uid}/transactions`),
      orderBy('createdAt', 'desc'),
      limit(RECENT_LIMIT),
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Transaction[],
        )
        setLoading(false)
      },
      (err) => {
        console.error('Failed to load transactions:', err)
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  return { transactions, loading, error }
}