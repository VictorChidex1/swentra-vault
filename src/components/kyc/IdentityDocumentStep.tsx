import {
  DOCUMENT_TYPE_LABELS,
  requiresBackSide,
  type IdentityDocument,
  type KycDraft,
} from '@/types/kyc'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DocumentUploader } from './DocumentUploader'

interface IdentityDocumentStepProps {
  data: Partial<IdentityDocument>
  files: {
    frontFile: File | null
    backFile: File | null
  }
  onChange: (updates: Partial<KycDraft>) => void
}

export function IdentityDocumentStep({
  data,
  files,
  onChange,
}: IdentityDocumentStepProps) {
  function updateData(field: keyof IdentityDocument, value: string) {
    onChange({ identityDocument: { ...data, [field]: value } })
  }

  function updateFile(side: 'front' | 'back', file: File | null) {
    onChange({
      [side === 'front' ? 'frontFile' : 'backFile']: file,
    } as Partial<KycDraft>)
  }

  const selectedType = data.documentType
  const needsBack = selectedType ? requiresBackSide(selectedType) : false

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Stage 02 / 04
        </p>
        <h2 className="mt-2 text-xl font-medium text-foreground">
          Identity Verification
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a valid government-issued identity document to secure your
          vault.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="kyc-doc-type">Document Type</Label>
        <select
          id="kyc-doc-type"
          value={data.documentType ?? ''}
          onChange={(e) => updateData('documentType', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          <option value="" disabled>
            Select a document type
          </option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-doc-num">Document Number</Label>
          <Input
            id="kyc-doc-num"
            placeholder="Document ID number"
            value={data.documentNumber ?? ''}
            onChange={(e) => updateData('documentNumber', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kyc-doc-expiry">Expiry Date</Label>
          <Input
            id="kyc-doc-expiry"
            type="date"
            value={data.expiryDate ?? ''}
            onChange={(e) => updateData('expiryDate', e.target.value)}
            required
          />
        </div>
      </div>

      {selectedType && (
        <div className="space-y-6 pt-4">
          <div className="h-px w-full bg-border" />

          <div
            className={`grid gap-6 ${needsBack ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}
          >
            <DocumentUploader
              label={
                needsBack ? 'Front of Document' : 'Identity / Data Page'
              }
              file={files.frontFile}
              onFileChange={(f) => updateFile('front', f)}
            />

            {needsBack && (
              <DocumentUploader
                label="Back of Document"
                file={files.backFile}
                onFileChange={(f) => updateFile('back', f)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
