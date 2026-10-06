import { useState } from "react";
import type { MouseEvent } from "react";
import { motion, useMotionValue, useMotionTemplate } from "motion/react";

import { cn } from "@/lib/utils";
import type { CurrencyCode } from "@/components/banking/CurrencyBadge";
import { CurrencyBadge } from "@/components/banking/CurrencyBadge";
import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DecryptText } from "@/components/common/DecryptText";
import { LiveTelemetryNumber } from "@/components/common/LiveTelemetryNumber";
import { formatCurrency } from "@/lib/format";

interface CurrencyAccount {
  name: string;
  currency: CurrencyCode;
  amount: number;
  blurb: string;
}

const CURRENCIES: CurrencyAccount[] = [
  {
    name: "Swiss Franc",
    currency: "CHF",
    amount: 181_220.0,
    blurb: "Your primary account for day-to-day banking.",
  },
  {
    name: "US Dollar",
    currency: "USD",
    amount: 100_000.0,
    blurb: "A reserve account for dollar holdings.",
  },
  {
    name: "Euro",
    currency: "EUR",
    amount: 71_420.9,
    blurb: "Hold and send euros without conversion.",
  },
  {
    name: "Nigerian Naira",
    currency: "NGN",
    amount: 18_400_000.0,
    blurb: "Send home with clear, upfront pricing.",
  },
];

function CurrencyCard({
  account,
  index,
  className,
}: {
  account: CurrencyAccount;
  index: number;
  className?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [hasEntered, setHasEntered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      onViewportEnter={() => setHasEntered(true)}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -6 }}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/5 bg-surface p-5 transition-all hover:shadow-2xl hover:shadow-primary/10",
        className,
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* 1. Holographic Border Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-20 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-[1px]"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(0, 255, 102, 0.5),
              transparent 80%
            )
          `,
          maskImage:
            "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
          WebkitMaskImage:
            "linear-gradient(#000, #000) content-box, linear-gradient(#000, #000)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* 2. Internal Glare */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 mix-blend-overlay"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.06),
              transparent 80%
            )
          `,
        }}
      />

      {/* 3. Data & Content */}
      <div className="relative z-10 flex items-center justify-between">
        <CurrencyBadge currency={account.currency} />
        <span className="text-xs text-muted-foreground font-mono">
          {hasEntered ? (
            <DecryptText
              text={account.name}
              delay={index * 150}
              duration={800}
            />
          ) : (
            account.name
          )}
        </span>
      </div>

      <p className="relative z-10 mt-6 text-2xl font-medium tabular-nums tracking-tight text-foreground sm:text-3xl">
        {hasEntered ? (
          <LiveTelemetryNumber
            value={account.amount}
            format={(value) => formatCurrency(value, account.currency)}
            duration={1.2 + index * 0.2}
          />
        ) : (
          formatCurrency(account.amount, account.currency)
        )}
      </p>

      <p className="relative z-10 mt-4 text-sm leading-relaxed text-muted-foreground">
        {account.blurb}
      </p>
    </motion.div>
  );
}

export function MultiCurrency() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Multi-currency banking"
          title="Every currency has its own account."
          description="Hold CHF, USD, EUR and NGN side by side. No toggle, no guesswork, no hidden conversions — each account shows exactly what it holds."
        />
      </Reveal>

      <div
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        style={{ perspective: "1500px" }}
      >
        {CURRENCIES.map((account, index) => {
          let spanClass = "";
          if (account.currency === "NGN") {
            spanClass = "sm:col-span-2 lg:col-span-3";
          } else if (account.currency === "EUR") {
            spanClass = "sm:col-span-2 lg:col-span-1";
          }

          return (
            <CurrencyCard
              key={account.currency}
              account={account}
              index={index}
              className={spanClass}
            />
          );
        })}
      </div>

      </section>
  );
}
