import { useState, useEffect, useMemo } from 'react'
import { collectionGroup, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { httpsCallable } from 'firebase/functions'
import { db, functions, storage } from '@/lib/firebase'
import { useAdminCache } from '@/hooks/useAdminCache'
import type { KycRecord } from '@/types/kyc'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Loader2Icon, 
  CheckCircleIcon, 
  XCircleIcon, 
  UserIcon,
  FileTextIcon,
  BriefcaseIcon
} from 'lucide-react'

// Extended record to include the User ID from the document reference
interface AdminKycRecord extends KycRecord {
  uid: string
  userEmail?: string
}

export default function KycReviewPage() {
  const fetcher = useMemo(() => async () => {
    const q = query(
      collectionGroup(db, 'kyc'),
      where('status', '==', 'UNDER_REVIEW')
    )
    const snapshot = await getDocs(q)
    
    const fetchedRecords: AdminKycRecord[] = []
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data() as KycRecord
      const uid = docSnapshot.ref.parent.parent?.id
      if (uid) {
        const userDoc = await getDoc(doc(db, 'users', uid))
        const userEmail = userDoc.exists() ? userDoc.data().email : 'Unknown'
        fetchedRecords.push({ ...data, uid, userEmail })
      }
    }
    return fetchedRecords
  }, [])

  const { data: recordsData, loading, mutate } = useAdminCache('kyc-pending', fetcher)
  const records = recordsData || []

  const [selectedRecord, setSelectedRecord] = useState<AdminKycRecord | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (records.length > 0 && !selectedRecord) {
      setSelectedRecord(records[0])
    }
  }, [records, selectedRecord])

  const handleReview = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedRecord) return
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.")
      return
    }

    try {
      setProcessing(true)
      const adminReviewKyc = httpsCallable<{ targetUid: string, status: string, rejectionReason?: string }, { success: boolean, message: string }>(functions, 'adminReviewKyc')
      
      const result = await adminReviewKyc({
        targetUid: selectedRecord.uid,
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
      })

      if (result.data.success) {
        toast.success(`KYC ${status.toLowerCase()} successfully.`)
        setSelectedRecord(null)
        setRejectionReason('')
        mutate(records.filter(r => r.uid !== selectedRecord.uid))
      }
    } catch (error: any) {
      console.error("KYC review failed", error)
      toast.error(error.message || "Failed to process KYC review.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">KYC Review Queue</h1>
        <p className="text-sm text-muted-foreground">
          {records.length} pending applications requiring manual review.
        </p>
      </div>

      <div className="flex flex-col md:flex-row flex-1 gap-6 overflow-hidden min-h-0 md:min-h-[600px]">
        {/* Left Column: Queue */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6 overflow-y-auto max-h-[30vh] md:max-h-full shrink-0">
          {records.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-border rounded-lg bg-surface/30">
              <CheckCircleIcon className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-medium text-foreground">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground mt-1">No pending KYC reviews in the queue.</p>
            </div>
          ) : (
            records.map((record) => (
              <Card 
                key={record.uid}
                className={`p-4 cursor-pointer transition-colors border ${selectedRecord?.uid === record.uid ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:bg-surface/80'}`}
                onClick={() => setSelectedRecord(record)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium truncate">
                    {record.personalDetails.firstName} {record.personalDetails.lastName}
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Pending
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                  <UserIcon className="w-3 h-3" />
                  {record.userEmail}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <FileTextIcon className="w-3 h-3" />
                  {record.identityDocument.documentType.replace('_', ' ')}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Right Column: Detail View */}
        <div className="w-full md:w-2/3 overflow-y-auto pb-8 md:pr-4">
          {selectedRecord ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Review Actions (Sticky) */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border border-border rounded-lg shadow-sm">
                <div>
                  <h2 className="text-lg font-medium">Review Application</h2>
                  <p className="text-xs text-muted-foreground">ID: {selectedRecord.uid}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleReview('REJECTED')}
                    disabled={processing}
                  >
                    {processing ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
                    Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleReview('VERIFIED')}
                    disabled={processing}
                  >
                    {processing ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircleIcon className="w-4 h-4 mr-2" />}
                    Approve
                  </Button>
                </div>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Rejection Reason (if rejecting)</label>
                <Input 
                  placeholder="E.g., ID is blurry, Name mismatch..." 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="bg-surface border-border"
                />
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  Identity Documents
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4 bg-surface border-border space-y-3">
                    <div className="text-sm font-medium">Front Side</div>
                    {selectedRecord.identityDocument.frontDocumentPath ? (
                      <div className="aspect-video bg-background rounded-md border border-border overflow-hidden relative group">
                        <StorageImage 
                          path={selectedRecord.identityDocument.frontDocumentPath} 
                          alt="ID Front" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-background rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                        No Image Provided
                      </div>
                    )}
                  </Card>
                  
                  {selectedRecord.identityDocument.backDocumentPath && (
                    <Card className="p-4 bg-surface border-border space-y-3">
                      <div className="text-sm font-medium">Back Side</div>
                      <div className="aspect-video bg-background rounded-md border border-border overflow-hidden relative group">
                        <StorageImage 
                          path={selectedRecord.identityDocument.backDocumentPath} 
                          alt="ID Back" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Personal Details
                  </h3>
                  <Card className="p-5 bg-surface border-border space-y-4">
                    <DetailRow label="First Name" value={selectedRecord.personalDetails.firstName} />
                    <DetailRow label="Last Name" value={selectedRecord.personalDetails.lastName} />
                    <DetailRow label="Date of Birth" value={selectedRecord.personalDetails.dateOfBirth} />
                    <DetailRow label="Nationality" value={selectedRecord.personalDetails.nationality} />
                    <DetailRow label="Residence" value={selectedRecord.personalDetails.countryOfResidence} />
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-1">Address</div>
                      <div className="text-sm">{selectedRecord.personalDetails.residentialAddress}</div>
                    </div>
                  </Card>
                </div>

                {/* Financial Profile */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                    <BriefcaseIcon className="w-4 h-4" />
                    Financial Profile
                  </h3>
                  <Card className="p-5 bg-surface border-border space-y-4">
                    <DetailRow label="Employment" value={selectedRecord.financialProfile.employmentStatus.replace('_', ' ')} />
                    <DetailRow label="Occupation" value={selectedRecord.financialProfile.occupation} />
                    <DetailRow label="Source of Funds" value={selectedRecord.financialProfile.sourceOfFunds.replace('_', ' ')} />
                    <DetailRow label="Monthly Activity" value={selectedRecord.financialProfile.expectedMonthlyActivity.replace('_', ' ')} />
                    <DetailRow label="Account Purpose" value={selectedRecord.financialProfile.accountPurpose.replace('_', ' ')} />
                  </Card>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select an application from the queue to review.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  )
}

function StorageImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // If the path is already an HTTP URL (e.g. from the emulator), use it directly
    if (path.startsWith('http')) {
      setUrl(path)
      return
    }

    const imageRef = ref(storage, path)
    getDownloadURL(imageRef)
      .then((downloadUrl) => setUrl(downloadUrl))
      .catch((err) => {
        console.error(`Failed to load image from storage: ${path}`, err)
        setError(true)
      })
  }, [path])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-destructive/10 text-destructive text-xs ${className}`}>
        Failed to load
      </div>
    )
  }

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-surface ${className}`}>
        <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <img src={url} alt={alt} className={className} />
}
