import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Loader2Icon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  createEmptyDraft,
  requiresBackSide,
  type KycDraft,
  type KycStep,
} from '@/types/kyc'
import { useKyc } from '@/hooks/useKyc'
import { PersonalDetailsStep } from './PersonalDetailsStep'
import { IdentityDocumentStep } from './IdentityDocumentStep'
import { FinancialProfileStep } from './FinancialProfileStep'
import { DeclarationsStep } from './DeclarationsStep'

export function KycWizard() {
  const { submit, submitting } = useKyc()
  const [step, setStep] = useState<KycStep>(1)
  const [draft, setDraft] = useState<KycDraft>(createEmptyDraft())

  const updateDraft = useCallback((updates: Partial<KycDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }, [])

  // Validation before allowing "Next"
  const canProceedToNext = useCallback(() => {
    switch (step) {
      case 1:
        return !!(
          draft.personalDetails.firstName &&
          draft.personalDetails.lastName &&
          draft.personalDetails.dateOfBirth &&
          draft.personalDetails.nationality &&
          draft.personalDetails.countryOfResidence &&
          draft.personalDetails.residentialAddress
        )
      case 2:
        if (
          !draft.identityDocument.documentType ||
          !draft.identityDocument.documentNumber ||
          !draft.identityDocument.expiryDate ||
          !draft.frontFile
        ) {
          return false
        }
        if (
          requiresBackSide(draft.identityDocument.documentType) &&
          !draft.backFile
        ) {
          return false
        }
        return true
      case 3:
        return !!(
          draft.financialProfile.employmentStatus &&
          draft.financialProfile.occupation &&
          draft.financialProfile.sourceOfFunds &&
          draft.financialProfile.expectedMonthlyActivity &&
          draft.financialProfile.accountPurpose
        )
      case 4:
        return !!(
          draft.declarations.informationAccurate &&
          draft.declarations.actingOnOwnBehalf &&
          draft.declarations.acceptsTerms &&
          draft.declarations.pepDeclaration === false // false means "I am NOT a PEP"
        )
      default:
        return false
    }
  }, [step, draft])

  const handleNext = () => {
    if (canProceedToNext() && step < 4) {
      setStep((s) => (s + 1) as KycStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as KycStep)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (!canProceedToNext()) return

    // Type casting is safe here because `canProceedToNext` enforces required fields
    try {
      await submit({
        personalDetails: draft.personalDetails as any,
        identityDocument: draft.identityDocument as any,
        financialProfile: draft.financialProfile as any,
        declarations: draft.declarations as any,
        frontFile: draft.frontFile!,
        backFile: draft.backFile,
      })
      toast.success('KYC Application Submitted', {
        description: 'Your documents have been securely transmitted for review.',
      })
    } catch (error) {
      toast.error('Submission Failed', {
        description:
          error instanceof Error ? error.message : 'Please try again later.',
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Bar */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>Verification Progress</span>
          <span>{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-surface">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-full flex-1 transition-colors duration-500 ${
                i <= step ? 'bg-primary' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <PersonalDetailsStep
                data={draft.personalDetails}
                onChange={(personalDetails) => updateDraft({ personalDetails })}
              />
            )}
            {step === 2 && (
              <IdentityDocumentStep
                data={draft.identityDocument}
                files={{
                  frontFile: draft.frontFile,
                  backFile: draft.backFile,
                }}
                onChange={updateDraft}
              />
            )}
            {step === 3 && (
              <FinancialProfileStep
                data={draft.financialProfile}
                onChange={(financialProfile) => updateDraft({ financialProfile })}
              />
            )}
            {step === 4 && (
              <DeclarationsStep
                data={draft.declarations}
                onChange={(declarations) => updateDraft({ declarations })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1 || submitting}
          className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 disabled:hover:text-muted-foreground"
        >
          Previous
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            disabled={!canProceedToNext()}
            className="rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceedToNext() || submitting}
            className="flex items-center gap-2 rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Encrypting...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="size-4" />
                Submit to Vault
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
