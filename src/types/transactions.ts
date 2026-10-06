import { Timestamp } from 'firebase/firestore'
import type { BeneficiaryType } from './beneficiary'

export type TransactionType = 'INTERNAL_TRANSFER' | 'SWENTRA_TRANSFER' | 'EXTERNAL_WIRE' | 'INCOMING_TRANSFER'
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface TransactionRecipientDetails {
  type: BeneficiaryType
  fullName?: string
  bankName?: string
  accountNumber?: string
  swiftCode?: string
  currency?: string
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number // Negative for outgoing, positive for incoming
  currency: string
  sourceAccountId?: string
  recipientDetails?: TransactionRecipientDetails
  sourceDetails?: { senderId: string, senderName?: string }
  exchangeRate?: number
  status: TransactionStatus
  reference: string
  createdAt: Timestamp | Date
}

export interface TransferRequest {
  sourceAccountId: string
  type: TransactionType
  amount: number
  currency: string
  recipientDetails: TransactionRecipientDetails
  reference?: string
  exchangeRate?: number
}
