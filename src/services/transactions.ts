import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import type { Transaction, TransferRequest } from '@/types/transactions'

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(
    collection(db, `users/${userId}/transactions`),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Transaction[]
}

export async function initiateTransfer(request: TransferRequest): Promise<{ success: boolean; transactionId: string }> {
  const executeTransfer = httpsCallable<TransferRequest, { success: boolean; transactionId: string }>(functions, 'executeTransfer')
  
  try {
    const result = await executeTransfer(request)
    return result.data
  } catch (error: any) {
    console.error('Transfer execution failed:', error)
    // Map common Firebase errors to user-friendly messages
    if (error.code === 'functions/failed-precondition') {
      throw new Error('Insufficient funds in the selected account.')
    }
    if (error.code === 'functions/not-found') {
      throw new Error('The recipient account could not be found.')
    }
    throw new Error(error.message || 'Transfer failed due to an unknown error.')
  }
}
