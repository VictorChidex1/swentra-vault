import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  onKycSnapshot,
  submitKyc,
  type KycSubmission,
} from '@/services/kyc'
import type { KycRecord, KycStatus } from '@/types/kyc'

interface UseKycReturn {
  /** The live KYC record, or null if not yet submitted. */
  record: KycRecord | null
  /** Shortcut to the current status. */
  status: KycStatus | null
  /** True while the initial snapshot is loading. */
  loading: boolean
  /** True while a submission is in progress. */
  submitting: boolean
  /** Submit a complete KYC application. */
  submit: (data: KycSubmission) => Promise<void>
  /** Error message from the last failed operation. */
  error: string | null
}

export function useKyc(): UseKycReturn {
  const { user } = useAuth()
  const [record, setRecord] = useState<KycRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Real-time listener
  useEffect(() => {
    if (!user) {
      setRecord(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = onKycSnapshot(user.uid, (rec) => {
      setRecord(rec)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const submit = useCallback(
    async (data: KycSubmission) => {
      if (!user) throw new Error('Not authenticated')

      setSubmitting(true)
      setError(null)

      try {
        await submitKyc(user.uid, data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'KYC submission failed'
        setError(message)
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [user],
  )

  return {
    record,
    status: record?.status ?? null,
    loading,
    submitting,
    submit,
    error,
  }
}
