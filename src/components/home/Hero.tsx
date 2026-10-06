import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 lg:px-8 lg:pt-28">
      <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        Banking technology prototype
      </span>

      <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
        Private banking, engineered for modern finance.
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
        A secure, multi-currency account with clear transfers. See every fee,
        every rate and every step — from the moment you send to the receipt you
        keep.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link to="/register">Open an account</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Link to="/login">Access your account</Link>
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Swentra Vault is a simulated financial environment for demonstration.
      </p>
    </section>
  )
}
