import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlobeIcon, BuildingIcon } from 'lucide-react'
import type { BeneficiaryType, BeneficiaryFormData } from '@/types/beneficiary'

interface AddBeneficiaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: BeneficiaryFormData) => Promise<void>
}

export function AddBeneficiaryModal({ open, onOpenChange, onAdd }: AddBeneficiaryModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState<BeneficiaryType>('INTERNAL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<BeneficiaryFormData>({
    type: 'INTERNAL',
    fullName: '',
    bankName: '',
    accountNumber: '',
    swiftCode: '',
    currency: 'CHF'
  })

  // Format Swentra 12-digit numbers with spaces: XXXX XXXX XXXX
  const formatInternalAccount = (val: string) => {
    const raw = val.replace(/\D/g, '').substring(0, 12)
    const match = raw.match(/.{1,4}/g)
    return match ? match.join(' ') : raw
  }

  const handleNext = () => {
    setFormData(prev => ({ 
      ...prev, 
      type,
      bankName: type === 'INTERNAL' ? 'Swentra Vault' : ''
    }))
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onAdd(formData)
      onOpenChange(false)
      setTimeout(() => {
        setStep(1)
        setFormData({ type: 'INTERNAL', fullName: '', bankName: '', accountNumber: '', swiftCode: '', currency: 'CHF' })
      }, 300)
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) setTimeout(() => setStep(1), 300)
    }}>
      <DialogContent className="sm:max-w-md bg-surface/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Trusted Payee</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Select the destination of the beneficiary.' : 'Enter beneficiary details.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 py-4">
            <button
              onClick={() => setType('INTERNAL')}
              className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-all ${
                type === 'INTERNAL' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-surface/50 hover:bg-surface'
              }`}
            >
              <div className="rounded-full bg-primary/20 p-2 text-primary">
                <BuildingIcon className="size-5" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Swentra Vault Account</h4>
                <p className="text-xs text-muted-foreground mt-1">Instant, zero-fee transfers to other Swentra users globally.</p>
              </div>
            </button>

            <button
              onClick={() => setType('EXTERNAL')}
              className={`flex items-start gap-4 rounded-lg border p-4 text-left transition-all ${
                type === 'EXTERNAL' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-surface/50 hover:bg-surface'
              }`}
            >
              <div className="rounded-full bg-primary/20 p-2 text-primary">
                <GlobeIcon className="size-5" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">International Wire</h4>
                <p className="text-xs text-muted-foreground mt-1">Send funds via SWIFT/IBAN to external bank accounts.</p>
              </div>
            </button>

            <Button onClick={handleNext} className="mt-4 w-full">Continue</Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Payee Full Name</Label>
              <Input
                required
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>

            {type === 'EXTERNAL' && (
              <div className="grid gap-2">
                <Label>Bank Name</Label>
                <Input
                  required
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g., UBS Switzerland AG"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>{type === 'INTERNAL' ? 'Swentra 12-Digit Account Number' : 'IBAN / Account Number'}</Label>
              <Input
                required
                value={formData.accountNumber}
                onChange={e => {
                  const val = e.target.value
                  setFormData({ 
                    ...formData, 
                    accountNumber: type === 'INTERNAL' ? formatInternalAccount(val) : val 
                  })
                }}
                className={type === 'INTERNAL' ? 'font-mono tracking-widest text-lg' : 'font-mono'}
                placeholder={type === 'INTERNAL' ? '0000 0000 0000' : 'CH93 0000 ...'}
              />
            </div>

            {type === 'EXTERNAL' && (
              <div className="grid gap-2">
                <Label>SWIFT / BIC Code</Label>
                <Input
                  required
                  value={formData.swiftCode}
                  onChange={e => setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() })}
                  placeholder="e.g., UBSWCHZH"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying...' : 'Verify & Save Payee'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
