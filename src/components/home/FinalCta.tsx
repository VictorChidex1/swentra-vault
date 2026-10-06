import { Link } from 'react-router-dom'

import { Reveal } from '@/components/common/Reveal'
import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Open your Swentra Vault account.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Multi-currency banking with transfers you can see through — start in
          minutes.
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
      </Reveal>
    </section>
  )
}
