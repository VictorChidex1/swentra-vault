import { Reveal } from '@/components/common/Reveal'
import { TerminalPanel } from '@/components/terminal/TerminalPanel'

export function Disclaimer() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <Reveal>
        <TerminalPanel className="bg-surface-2/50">
          <p className="text-xs tracking-[0.2em] text-warning uppercase">
            Prototype notice
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Swentra Vault is a banking technology prototype and simulated
            financial environment. Transactions, balances, KYC verification and
            settlement shown in this demonstration are simulated and do not
            represent real banking services or regulated financial activity.
          </p>
        </TerminalPanel>
      </Reveal>
    </section>
  )
}
