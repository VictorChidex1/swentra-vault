import { Timestamp } from 'firebase/firestore'

export type BeneficiaryType = 'INTERNAL' | 'EXTERNAL'
export type BeneficiaryStatus = 'ACTIVE' | 'PENDING_APPROVAL'

export interface Beneficiary {
  id: string
  userId: string
  type: BeneficiaryType
  fullName: string
  bankName: string
  accountNumber: string // 12 digits or IBAN
  swiftCode?: string    // For EXTERNAL
  currency: string      // CHF, USD, EUR, GBP
  status: BeneficiaryStatus
  createdAt: Timestamp | Date
}

export interface BeneficiaryFormData {
  type: BeneficiaryType
  fullName: string
  bankName: string
  accountNumber: string
  swiftCode: string
  currency: string
}
