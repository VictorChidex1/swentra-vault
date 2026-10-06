import type { Timestamp } from 'firebase/firestore'

// ---------------------------------------------------------------------------
// KYC Status
// ---------------------------------------------------------------------------

export type KycStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'MORE_INFORMATION_REQUIRED'

// ---------------------------------------------------------------------------
// Document Types
// ---------------------------------------------------------------------------

export type DocumentType =
  | 'passport'
  | 'national_id'
  | 'drivers_license'
  | 'residence_permit'

/** Document types that require front + back uploads. */
export const DUAL_SIDE_DOCUMENTS: DocumentType[] = [
  'national_id',
  'drivers_license',
  'residence_permit',
]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: 'International Passport',
  national_id: 'National ID Card',
  drivers_license: "Driver's License",
  residence_permit: 'Residence Permit',
}

export function requiresBackSide(type: DocumentType): boolean {
  return DUAL_SIDE_DOCUMENTS.includes(type)
}

// ---------------------------------------------------------------------------
// Stage 1 — Personal Information
// ---------------------------------------------------------------------------

export interface PersonalDetails {
  firstName: string
  lastName: string
  dateOfBirth: string // ISO date string YYYY-MM-DD
  nationality: string
  countryOfResidence: string
  residentialAddress: string
}

// ---------------------------------------------------------------------------
// Stage 2 — Identity Document
// ---------------------------------------------------------------------------

export interface IdentityDocument {
  documentType: DocumentType
  documentNumber: string
  expiryDate: string // ISO date string YYYY-MM-DD
  // Files are uploaded to Storage, paths stored here after submission
  frontDocumentPath?: string
  backDocumentPath?: string
}

// ---------------------------------------------------------------------------
// Stage 3 — Financial Profile
// ---------------------------------------------------------------------------

export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired'
  | 'student'

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  employed: 'Employed',
  self_employed: 'Self-Employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
  student: 'Student',
}

export type SourceOfFunds =
  | 'salary'
  | 'business_income'
  | 'investments'
  | 'inheritance'
  | 'savings'
  | 'other'

export const SOURCE_OF_FUNDS_LABELS: Record<SourceOfFunds, string> = {
  salary: 'Salary / Wages',
  business_income: 'Business Income',
  investments: 'Investments / Returns',
  inheritance: 'Inheritance / Gift',
  savings: 'Personal Savings',
  other: 'Other',
}

export type MonthlyActivity =
  | 'under_5000'
  | '5000_25000'
  | '25000_100000'
  | 'over_100000'

export const MONTHLY_ACTIVITY_LABELS: Record<MonthlyActivity, string> = {
  under_5000: 'Under $5,000',
  '5000_25000': '$5,000 — $25,000',
  '25000_100000': '$25,000 — $100,000',
  over_100000: 'Over $100,000',
}

export type AccountPurpose =
  | 'personal_savings'
  | 'business_payments'
  | 'investments'
  | 'international_transfers'
  | 'other'

export const ACCOUNT_PURPOSE_LABELS: Record<AccountPurpose, string> = {
  personal_savings: 'Personal Savings',
  business_payments: 'Business Payments',
  investments: 'Investments',
  international_transfers: 'International Transfers',
  other: 'Other',
}

export interface FinancialProfile {
  employmentStatus: EmploymentStatus
  occupation: string
  sourceOfFunds: SourceOfFunds
  expectedMonthlyActivity: MonthlyActivity
  accountPurpose: AccountPurpose
}

// ---------------------------------------------------------------------------
// Stage 4 — Declarations
// ---------------------------------------------------------------------------

export interface Declarations {
  informationAccurate: boolean
  actingOnOwnBehalf: boolean
  acceptsTerms: boolean
  pepDeclaration: boolean // false = user confirms they are NOT a PEP
}

// ---------------------------------------------------------------------------
// Complete KYC Submission (Firestore document)
// ---------------------------------------------------------------------------

export interface KycRecord {
  status: KycStatus
  personalDetails: PersonalDetails
  identityDocument: Omit<IdentityDocument, 'frontDocumentPath' | 'backDocumentPath'> & {
    frontDocumentPath: string
    backDocumentPath: string | null
  }
  financialProfile: FinancialProfile
  declarations: Declarations
  submittedAt: Timestamp
  reviewedAt: Timestamp | null
  reviewedBy: string | null
  rejectionReason: string | null
}

// ---------------------------------------------------------------------------
// Wizard local state (before submission)
// ---------------------------------------------------------------------------

export type KycStep = 1 | 2 | 3 | 4

export interface KycDraft {
  personalDetails: Partial<PersonalDetails>
  identityDocument: Partial<IdentityDocument>
  financialProfile: Partial<FinancialProfile>
  declarations: Partial<Declarations>
  frontFile: File | null
  backFile: File | null
}

export function createEmptyDraft(): KycDraft {
  return {
    personalDetails: {},
    identityDocument: {},
    financialProfile: {},
    declarations: {},
    frontFile: null,
    backFile: null,
  }
}
