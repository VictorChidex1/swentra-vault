import { useState, useEffect } from 'react'
import { getTransactions } from '@/services/transactions'
import { useAuth } from './useAuth'
import type { Transaction } from '@/types/transactions'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    async function load() {
      try {
        setLoading(true)
        const data = await getTransactions(user!.uid)
        setTransactions(data)
      } catch (err: any) {
        console.error('Failed to load transactions:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return { transactions, loading, error, refresh: () => {
    if (user) {
      setLoading(true)
      getTransactions(user.uid)
        .then(setTransactions)
        .catch(setError)
        .finally(() => setLoading(false))
    }
  }}
}
