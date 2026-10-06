import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await sendPasswordReset(email)
      setSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      if (message.includes('user-not-found')) {
        setError('No account found with this email address.')
      } else if (message.includes('invalid-email')) {
        setError('Invalid email address.')
      } else {
        setError(message.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)$/, ''))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthPageShell
        title="Check your email"
        subtitle="If an account exists, you'll receive a password reset link shortly."
      >
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-medium text-primary underline transition-colors hover:text-primary/80"
            >
              try again
            </button>
            .
          </p>

          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link to="/login">
              <ArrowLeftIcon className="size-4" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-medium text-primary underline transition-colors hover:text-primary/80"
        >
          <ArrowLeftIcon className="size-3" />
          Back to sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}