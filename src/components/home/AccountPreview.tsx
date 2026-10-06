import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "motion/react";

import type { CurrencyCode } from "@/components/banking/CurrencyBadge";
import { CurrencyBadge } from "@/components/banking/CurrencyBadge";
import { LiveTelemetryNumber } from "@/components/common/LiveTelemetryNumber";
import { Reveal } from "@/components/common/Reveal";
import {
  TerminalFrame,
  TerminalHeader,
} from "@/components/terminal/TerminalFrame";
import { TerminalStatus } from "@/components/terminal/TerminalStatus";
import { formatCurrency } from "@/lib/format";
import {
  fetchLatestChfRates,
  getFallbackChfRates,
  type ChfRates,
} from "@/services/exchange-rates";

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

// Live CHF cross-rates are fetched in the component and used to consolidate
// the four currency balances into the "total balance" figure.

export function AccountPreview() {
  const containerRef = useRef<HTMLElement>(null);
  const [rates, setRates] = useState<ChfRates>(getFallbackChfRates);
  const [rateStatus, setRateStatus] = useState<"loading" | "live" | "unavailable">(
    "loading",
  );
  const [asOf, setAsOf] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchLatestChfRates()
      .then(({ rates, asOf }) => {
        if (!active) return;
        setRates(rates);
        setAsOf(asOf);
        setRateStatus("live");
      })
      .catch(() => {
        if (!active) return;
        setRateStatus("unavailable");
      });
    return () => {
      active = false;
    };
  }, []);

  const totalChf = useMemo(
    () => ACCOUNTS.reduce((sum, account) => sum + account.amount * rates[account.currency], 0),
    [rates],
  );
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the 3D spatial tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-3, 3]), {
    stiffness: 150,
    damping: 20,
  });

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Normalize coordinates from -0.5 to 0.5
    const x = (e.clientX - rect.left) / width - 0.5;
    const y = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  // Dynamic glare positioning based on mouse
  const glareX = useTransform(mouseX, [-0.5, 0.5], [100, -100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [100, -100]);

  // Format amount for the currency accounts
  const formatAmount = (amount: number, currency: CurrencyCode) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <section
      ref={containerRef}
      className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"
      style={{ perspective: "2000px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Reveal>
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative rounded-xl shadow-2xl transition-all duration-300 ease-out"
        >
          {/* Spatial Glare Effect */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded-xl mix-blend-overlay"
            style={{
              background: useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)`,
            }}
          />
          <TerminalFrame>
            <TerminalHeader
              title="Account overview"
              meta="Demonstration data"
            />
            <div className="p-6 sm:p-8">
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Total balance
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                <LiveTelemetryNumber
                  value={totalChf}
                  format={(value) => formatCurrency(value, "CHF")}
                />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {rateStatus === "live"
                  ? `Consolidated value · live FX rates · as of ${asOf}`
                  : rateStatus === "loading"
                    ? "Consolidated value · fetching live FX rates…"
                    : "Consolidated value · rates unavailable — showing last known rates"}
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
                    <LiveTelemetryNumber
                      value={account.amount}
                      format={(value) => formatAmount(value, account.currency)}
                      className="text-xl"
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
        </motion.div>
      </Reveal>
    </section>
  );
}
