import type { CurrencyCode } from "@/components/banking/CurrencyBadge";
import { CurrencyBadge } from "@/components/banking/CurrencyBadge";
import { BalanceDisplay } from "@/components/banking/BalanceDisplay";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { Reveal } from "@/components/common/Reveal";
import {
  TerminalFrame,
  TerminalHeader,
} from "@/components/terminal/TerminalFrame";
import { TerminalStatus } from "@/components/terminal/TerminalStatus";
import { formatCurrency } from "@/lib/format";

interface DemoAccount {
  name: string;
  currency: CurrencyCode;
  amount: number;
}

const ACCOUNTS: DemoAccount[] = [
  { name: "CHF Primary", currency: "CHF", amount: 181_220.0 },
  { name: "USD Reserve", currency: "USD", amount: 100_000.0 },
  { name: "EUR Account", currency: "EUR", amount: 71_420.9 },
  { name: "NGN Account", currency: "NGN", amount: 18_400_000.0 },
];

// Simulated demo rates used to consolidate the four currency balances into a
// CHF "total balance" figure. Demonstration values only.
const CHF_RATES: Record<CurrencyCode, number> = {
  CHF: 1,
  USD: 0.9,
  EUR: 0.93,
  NGN: 0.00055,
};

const TOTAL = ACCOUNTS.reduce(
  (sum, account) => sum + account.amount * CHF_RATES[account.currency],
  0,
);

export function AccountPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
      <Reveal>
        <TerminalFrame>
          <TerminalHeader title="Account overview" meta="Demonstration data" />
          <div className="p-6 sm:p-8">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Total balance
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              <AnimatedNumber
                value={TOTAL}
                format={(value) => formatCurrency(value, "CHF")}
              />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Simulated consolidated value
            </p>
            <div className="mt-5 h-px w-16 bg-primary" aria-hidden="true" />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ACCOUNTS.map((account) => (
                <div
                  key={account.name}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2/50 px-4 py-3 transition-colors hover:border-primary/60 hover:bg-surface-2"
                >
                  <div className="flex items-center gap-2">
                    <CurrencyBadge currency={account.currency} />
                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                      {account.name}
                    </span>
                  </div>
                  <BalanceDisplay
                    amount={account.amount}
                    currency={account.currency}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5">
              <TerminalStatus label="Multi-currency accounts" />
              <TerminalStatus label="Clear transfer pricing" />
              <TerminalStatus label="Transaction PIN protection" />
            </div>
          </div>
        </TerminalFrame>
      </Reveal>
    </section>
  );
}
