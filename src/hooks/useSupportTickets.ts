import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export type TicketCategory = 'TRANSFER_ISSUE' | 'SECURITY' | 'ACCOUNT_LIMITS' | 'GENERAL'
export type TicketStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED'

export interface SupportTicket {
  id: string
  userId: string
  category: TicketCategory
  subject: string
  message: string
  status: TicketStatus
  createdAt: any
}

export function useSupportTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'supportTickets'),
        where('userId', '==', user.uid)
      )
      const querySnapshot = await getDocs(q)
      const fetched = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SupportTicket[]
      
      // Sort locally to avoid needing a composite index for a small collection
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0
        const timeB = b.createdAt?.toMillis?.() || 0
        return timeB - timeA
      })

      setTickets(fetched)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const createTicket = async (data: Omit<SupportTicket, 'id' | 'userId' | 'status' | 'createdAt'>) => {
    if (!user) throw new Error('Not authenticated')
    
    const docRef = await addDoc(collection(db, 'supportTickets'), {
      userId: user.uid,
      category: data.category,
      subject: data.subject,
      message: data.message,
      status: 'OPEN',
      createdAt: serverTimestamp(),
    })
    
    // Optimistic update
    setTickets((prev) => [
      {
        id: docRef.id,
        userId: user.uid,
        category: data.category,
        subject: data.subject,
        message: data.message,
        status: 'OPEN',
        createdAt: { toDate: () => new Date(), toMillis: () => Date.now() },
      },
      ...prev,
    ])
    
    return docRef.id
  }

  return { tickets, loading, error, createTicket, refreshTickets: fetchTickets }
}
