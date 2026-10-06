import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type {
  KycRecord,
  PersonalDetails,
  FinancialProfile,
  Declarations,
  DocumentType,
} from '@/types/kyc'
import { requiresBackSide } from '@/types/kyc'

// ---------------------------------------------------------------------------
// Firestore paths
// ---------------------------------------------------------------------------

function kycDocRef(uid: string) {
  return doc(db, 'users', uid, 'kyc', 'submission')
}

// ---------------------------------------------------------------------------
// Storage paths
// ---------------------------------------------------------------------------

function frontStoragePath(uid: string): string {
  return `kyc/${uid}/identity/front.jpg`
}

function backStoragePath(uid: string): string {
  return `kyc/${uid}/identity/back.jpg`
}

// ---------------------------------------------------------------------------
// Read KYC record
// ---------------------------------------------------------------------------

export async function getKycRecord(uid: string): Promise<KycRecord | null> {
  const snap = await getDoc(kycDocRef(uid))
  return snap.exists() ? (snap.data() as KycRecord) : null
}

/**
 * Subscribe to real-time KYC status changes.
 * Returns an unsubscribe function.
 */
export function onKycSnapshot(
  uid: string,
  callback: (record: KycRecord | null) => void,
): () => void {
  return onSnapshot(kycDocRef(uid), (snap) => {
    callback(snap.exists() ? (snap.data() as KycRecord) : null)
  })
}

// ---------------------------------------------------------------------------
// Upload identity documents to Firebase Storage
// ---------------------------------------------------------------------------

async function uploadDocument(
  uid: string,
  side: 'front' | 'back',
  file: File,
): Promise<string> {
  const path =
    side === 'front' ? frontStoragePath(uid) : backStoragePath(uid)
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: { uploadedBy: uid },
  })
  return path
}

// ---------------------------------------------------------------------------
// Submit KYC (atomic: upload files, then write Firestore doc)
// ---------------------------------------------------------------------------

export interface KycSubmission {
  personalDetails: PersonalDetails
  identityDocument: {
    documentType: DocumentType
    documentNumber: string
    expiryDate: string
  }
  financialProfile: FinancialProfile
  declarations: Declarations
  frontFile: File
  backFile: File | null
}

export async function submitKyc(
  uid: string,
  data: KycSubmission,
): Promise<void> {
  // 1. Upload front document
  const frontPath = await uploadDocument(uid, 'front', data.frontFile)

  // 2. Upload back document (if required)
  let backPath: string | null = null
  if (data.backFile && requiresBackSide(data.identityDocument.documentType)) {
    backPath = await uploadDocument(uid, 'back', data.backFile)
  }

  // 3. Mask the document number for storage (show only last 4 chars)
  const docNum = data.identityDocument.documentNumber
  const maskedNumber =
    docNum.length > 4
      ? '●'.repeat(docNum.length - 4) + docNum.slice(-4)
      : docNum

  // 4. Write the Firestore document
  const record: Omit<KycRecord, 'submittedAt'> & { submittedAt: ReturnType<typeof serverTimestamp> } = {
    status: 'UNDER_REVIEW',
    personalDetails: data.personalDetails,
    identityDocument: {
      documentType: data.identityDocument.documentType,
      documentNumber: maskedNumber,
      expiryDate: data.identityDocument.expiryDate,
      frontDocumentPath: frontPath,
      backDocumentPath: backPath,
    },
    financialProfile: data.financialProfile,
    declarations: data.declarations,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  }

  await setDoc(kycDocRef(uid), record)
}

// ---------------------------------------------------------------------------
// Cleanup on failed submission (delete orphan uploads)
// ---------------------------------------------------------------------------

export async function cleanupOrphanUploads(uid: string): Promise<void> {
  try {
    await deleteObject(ref(storage, frontStoragePath(uid)))
  } catch {
    // File may not exist yet
  }
  try {
    await deleteObject(ref(storage, backStoragePath(uid)))
  } catch {
    // File may not exist yet
  }
}
