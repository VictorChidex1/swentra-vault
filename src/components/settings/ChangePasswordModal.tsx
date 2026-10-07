import { useState } from 'react'
import { Eye, EyeOff, Loader2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

interface ChangePasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const { reauthenticateAndChangePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Password strength checks (reused from RegisterPage)
  const hasLength = newPassword.length >= 8
  const hasUpper = /[A-Z]/.test(newPassword)
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const strengthScore = [hasLength, hasUpper, hasSymbol].filter(Boolean).length

  function getStrengthLabel() {
    if (newPassword.length === 0) return 'AWAITING INPUT_'
    if (strengthScore === 1) return 'WEAK'
    if (strengthScore === 2) return 'FAIR'
    if (strengthScore === 3) return 'SECURE'
    return ''
  }

  function getStrengthColor() {
    if (strengthScore === 3) return 'bg-[#00FF66]' // Terminal Green
    if (strengthScore === 2) return 'bg-yellow-500'
    if (strengthScore === 1) return 'bg-red-500'
    return 'bg-white/10'
  }

  function getTextColor() {
    if (strengthScore === 3) return 'text-[#00FF66]'
    if (strengthScore === 2) return 'text-yellow-500'
    if (strengthScore === 1) return 'text-red-500'
    return 'text-muted-foreground/40'
  }

  const isValid = strengthScore === 3 && newPassword === confirmPassword && currentPassword.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (!isValid) return

    setSubmitting(true)
    try {
      await reauthenticateAndChangePassword(currentPassword, newPassword)
      setSuccess(true)
      // Reset form on success
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }, 2000)
    } catch (err: any) {
      const message = err.message || 'Failed to update password'
      if (message.includes('wrong-password') || message.includes('invalid-credential')) {
        setError('Incorrect current password.')
      } else {
        setError(message.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)$/, ''))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-surface border-border p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Update Security Key</DialogTitle>
          <DialogDescription className="mt-1.5">
            For your protection, please verify your current password before setting a new one.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary">Key Updated</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your vault's master password has been successfully secured.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex h-1.5 w-full gap-1">
                  <div className={`h-full w-1/3 rounded-full transition-colors duration-300 ${strengthScore >= 1 ? getStrengthColor() : 'bg-white/10'}`} />
                  <div className={`h-full w-1/3 rounded-full transition-colors duration-300 ${strengthScore >= 2 ? getStrengthColor() : 'bg-white/10'}`} />
                  <div className={`h-full w-1/3 rounded-full transition-colors duration-300 ${strengthScore >= 3 ? getStrengthColor() : 'bg-white/10'}`} />
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                  <span className="flex gap-2 text-muted-foreground/60">
                    <span className={hasLength ? 'text-[#00FF66] transition-colors' : 'transition-colors'}>8+ CHARS</span>
                    <span className={hasUpper ? 'text-[#00FF66] transition-colors' : 'transition-colors'}>1 UPPER</span>
                    <span className={hasSymbol ? 'text-[#00FF66] transition-colors' : 'transition-colors'}>1 SYMBOL</span>
                  </span>
                  <span className={`font-semibold transition-colors ${getTextColor()}`}>
                    [{getStrengthLabel()}]
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive mt-1">Passwords do not match.</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded border border-destructive/20" role="alert">
                {error}
              </p>
            )}

            <div className="pt-4 flex gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                className="w-1/3" 
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-2/3" 
                disabled={!isValid || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Updating Key...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
