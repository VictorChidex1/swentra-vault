import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Beneficiary, BeneficiaryFormData } from '@/types/beneficiary'

export async function getBeneficiaries(userId: string): Promise<Beneficiary[]> {
  const q = query(
    collection(db, `users/${userId}/beneficiaries`),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Beneficiary[]
}

export async function createBeneficiary(userId: string, data: BeneficiaryFormData): Promise<string> {
  const docRef = doc(collection(db, `users/${userId}/beneficiaries`))
  
  // Basic validation rules to ensure data structure
  if (data.type === 'INTERNAL' && !/^\d{12}$/.test(data.accountNumber.replace(/\s/g, ''))) {
    throw new Error('Invalid internal account number. Must be 12 digits.')
  }

  if (data.type === 'EXTERNAL' && data.accountNumber.length < 10) {
    throw new Error('Invalid IBAN/Account Number')
  }

  const beneficiary = {
    id: docRef.id,
    userId,
    ...data,
    status: 'ACTIVE', // Defaulting to active for prototype
    createdAt: serverTimestamp(),
  }

  await setDoc(docRef, beneficiary)
  return docRef.id
}

export async function deleteBeneficiary(userId: string, beneficiaryId: string): Promise<void> {
  const docRef = doc(db, `users/${userId}/beneficiaries/${beneficiaryId}`)
  await deleteDoc(docRef)
}
