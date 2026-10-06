import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailIcon, CheckCircle2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { useAuth } from '@/hooks/useAuth'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmail, applyVerificationCode, user, loading } = useAuth()
  const [resending, setResending] = useState(false)
  const [verifying, setVerifying] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const oobCode = searchParams.get('oobCode')
  const pending = searchParams.get('pending') === 'true'

  // Handle verification via email link (oobCode present)
  useEffect(() => {
    if (!oobCode) return

    async function handleCode() {
      setVerifying('idle')
      try {
        if (!oobCode) return
        await applyVerificationCode(oobCode)
        setVerifying('success')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Verification failed'
        if (message.includes('expired-action-code')) {
          setError('This verification link has expired. Request a new one below.')
        } else if (message.includes('already-verified') || message.includes('user-not-found')) {
          setVerifying('success')
        } else {
          setError(message.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)$/, ''))
        }
        setVerifying('error')
      }
    }

    handleCode()
  }, [oobCode, applyVerificationCode])

  async function handleResend() {
    setResending(true)
    setError(null)
    try {
      await verifyEmail()
    } catch {
      setError('Failed to send verification email. Try again.')
    } finally {
      setResending(false)
    }
  }

  // Automatically redirect to /app when verified and not in pending mode
  useEffect(() => {
    if (verifying === 'success' && user?.emailVerified && !loading) {
      const timer = setTimeout(() => navigate('/app', { replace: true }), 2000)
      return () => clearTimeout(timer)
    }
  }, [verifying, user, loading, navigate])

  // Success state (verified via link)
  if (verifying === 'success') {
    return (
      <AuthPageShell
        title="Email verified"
        subtitle="Your email has been verified successfully."
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <CheckCircle2Icon className="size-12 text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Redirecting to your account…
          </p>
          <Button asChild className="w-full">
            <Link to="/app">Go to your account</Link>
          </Button>
        </div>
      </AuthPageShell>
    )
  }

  // Error while verifying
  if (verifying === 'error') {
    return (
      <AuthPageShell
        title="Verification failed"
        subtitle={error ?? 'Something went wrong.'}
      >
        <div className="space-y-4">
          <Button onClick={handleResend} className="w-full" disabled={resending}>
            {resending ? 'Sending…' : 'Resend verification email'}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/app">Go to your account</Link>
          </Button>
        </div>
      </AuthPageShell>
    )
  }

  // Pending — user was just registered
  return (
    <AuthPageShell
      title="Verify your email"
      subtitle={
        pending
          ? "We've sent a verification link to your email. Click it to activate your account."
          : 'Your email needs to be verified before you can access your account.'
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <MailIcon className="size-12 text-muted-foreground" />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">{error}</p>
        )}

        <Button
          onClick={handleResend}
          className="w-full"
          disabled={resending}
        >
          {resending ? 'Sending…' : 'Resend verification email'}
        </Button>

        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Back to sign in</Link>
        </Button>
      </div>
    </AuthPageShell>
  )
}