import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AuthIllustration } from './AuthIllustration'

interface AuthPageShellProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <div className="grid min-h-[100dvh] w-full grid-cols-1 lg:grid-cols-2 bg-[#050505]">
      {/* Left Panel: High-End Illustration (Hidden on Mobile) */}
      <AuthIllustration />

      {/* Right Panel: Auth Form */}
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
        
        {/* Subtle glowing orb in background of form */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.015)_0%,transparent_60%)]" />

        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            {/* Header */}
            <div className="mb-10 text-center lg:text-left">
              <Link to="/" className="inline-flex items-center gap-3 mb-8">
                <img
                  src="/assets/swentra-vault-logo-256.png"
                  alt="Swentra Vault"
                  className="size-8 rounded-md border border-white/10"
                />
                <span className="text-sm font-semibold tracking-[0.18em] text-foreground">
                  SWENTRA VAULT
                </span>
              </Link>
              
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm text-muted-foreground/80">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form Content */}
            <div className="rounded-xl border border-border/40 bg-surface/40 p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              {children}
            </div>

            {/* Footer / Terminal prompt illusion */}
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-2 font-mono text-xs text-muted-foreground/40">
              <span className="text-primary/50">❯</span>
              <span className="animate-pulse">Awaiting input_</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}