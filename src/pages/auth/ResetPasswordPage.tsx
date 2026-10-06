import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { useAuth } from '@/hooks/useAuth'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const { confirmPasswordReset } = useAuth()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'done'>('loading')

  const oobCode = searchParams.get('oobCode')

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing reset code.')
    }
    setStatus('ready')
  }, [oobCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!oobCode) return

    setError(null)
    setSubmitting(true)

    try {
      await confirmPasswordReset(oobCode, password)
      setStatus('done')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset password'
      if (message.includes('expired-action-code')) {
        setError('This reset link has expired. Please request a new one.')
      } else if (message.includes('invalid-action-code')) {
        setError('Invalid reset link. Please request a new one.')
      } else if (message.includes('weak-password')) {
        setError('Password is too weak.')
      } else {
        setError(message.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)$/, ''))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'done') {
    return (
      <AuthPageShell
        title="Password reset"
        subtitle="Your password has been updated successfully."
      >
        <Button asChild className="w-full">
          <Link to="/login">Sign in with your new password</Link>
        </Button>
      </AuthPageShell>
    )
  }

  return (
    <AuthPageShell
      title="Set new password"
      subtitle="Enter your new password below."
    >
      {!oobCode ? (
        <div className="space-y-4">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/forgot-password">Request a new reset link</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              autoFocus
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || password.length < 8}
          >
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      )}
    </AuthPageShell>
  )
}