import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getBeneficiaries, createBeneficiary, deleteBeneficiary } from '@/services/beneficiaries'
import type { Beneficiary, BeneficiaryFormData } from '@/types/beneficiary'
import { toast } from 'sonner'

export function useBeneficiaries() {
  const { user } = useAuth()
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBeneficiaries = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getBeneficiaries(user.uid)
      setBeneficiaries(data)
    } catch (err) {
      console.error('Error fetching beneficiaries:', err)
      setError(err instanceof Error ? err : new Error('Failed to load beneficiaries'))
      toast.error('Failed to load beneficiaries')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBeneficiaries()
  }, [fetchBeneficiaries])

  const addBeneficiary = async (data: BeneficiaryFormData) => {
    if (!user) throw new Error('Not authenticated')
    try {
      await createBeneficiary(user.uid, data)
      toast.success('Payee successfully verified and saved.')
      await fetchBeneficiaries()
    } catch (err) {
      console.error('Error adding beneficiary:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add payee')
      throw err
    }
  }

  const removeBeneficiary = async (id: string) => {
    if (!user) throw new Error('Not authenticated')
    try {
      await deleteBeneficiary(user.uid, id)
      toast.success('Trusted payee removed.')
      await fetchBeneficiaries()
    } catch (err) {
      console.error('Error removing beneficiary:', err)
      toast.error('Failed to remove payee')
      throw err
    }
  }

  return {
    beneficiaries,
    isLoading,
    error,
    addBeneficiary,
    removeBeneficiary,
    refresh: fetchBeneficiaries
  }
}
