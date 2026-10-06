import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthPageShell } from '@/components/auth/AuthPageShell'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({})
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password strength checks
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const strengthScore = [hasLength, hasUpper, hasSymbol].filter(Boolean).length

  function getStrengthLabel() {
    if (password.length === 0) return 'AWAITING INPUT_'
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

  function validate(): boolean {
    const errors: typeof fieldErrors = {}

    if (!email.includes('@')) {
      errors.email = 'Enter a valid email address.'
    }

    if (strengthScore < 3) {
      errors.password = 'Password must meet all security requirements.'
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setSubmitting(true)

    try {
      await signUp(email, password)
      navigate('/verify-email?pending=true', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      if (message.includes('email-already-in-use')) {
        setError('An account with this email already exists.')
      } else if (message.includes('weak-password')) {
        setError('Password is too weak.')
      } else if (message.includes('invalid-email')) {
        setError('Invalid email address.')
      } else {
        setError(message.replace(/^Firebase: /, '').replace(/ \(auth\/.*\)$/, ''))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthPageShell
      title="Open an account"
      subtitle="Create your Swentra Vault account."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <p className="text-sm text-destructive">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter secure password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFieldErrors((prev) => ({ ...prev, password: undefined }))
              }}
              required
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

          {fieldErrors.password && (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))
              }}
              required
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.confirmPassword}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={submitting}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-primary underline transition-colors hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </AuthPageShell>
  )
}