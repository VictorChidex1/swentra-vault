import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import type { BankAccount } from '@/types/accounts'

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Listen to the user's specific accounts collection
    const accountsRef = collection(db, `users/${user.uid}/accounts`)
    
    // Sort so CHF is typically primary (alphabetical fallback or custom sort logic could go here)
    const q = query(accountsRef, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accs: BankAccount[] = []
        snapshot.forEach((doc) => {
          accs.push({ id: doc.id, ...doc.data() } as BankAccount)
        })
        // Filter out system accounts from the regular user dashboard
        const personalAccs = accs.filter(acc => !acc.isSystemAccount)
        
        // Custom sort: CHF first, then USD, EUR, NGN, GBP
        const sortedAccs = personalAccs.sort((a, b) => {
          const order = { CHF: 1, USD: 2, EUR: 3, NGN: 4, GBP: 5 }
          return (order[a.currency as keyof typeof order] || 99) - (order[b.currency as keyof typeof order] || 99)
        })

        setAccounts(sortedAccs)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching accounts:', err)
        setError('Failed to load banking accounts. Please try again later.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  return { accounts, loading, error }
}
