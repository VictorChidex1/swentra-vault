import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'

import { DecryptText } from '@/components/common/DecryptText'

interface FooterLink {
  label: string
  to: string
}

const PRODUCT_LINKS: FooterLink[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Security', to: '/security' },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
]

const ACCOUNT_LINKS: FooterLink[] = [
  { label: 'Access your account', to: '/login' },
  { label: 'Open an account', to: '/register' },
]

const TICKER_ITEMS = [
  "NODE_01: ONLINE",
  "LATENCY: 12ms",
  "ENCRYPTION: AES-256-GCM",
  "UPTIME: 99.999%",
  "LEDGER: SYNCHRONIZED",
  "ACTIVE SESSIONS: 8,432",
  "THROUGHPUT: 1.2 GB/s",
  "DEFENSE_GRID: SECURE",
  "NODE_02: ONLINE",
  "LATENCY: 11ms",
]

const YEAR = new Date().getFullYear()

function FooterLinkItem({ link }: { link: FooterLink }) {
  const [isHovered, setIsHovered] = useState(false)
  const [scrambleKey, setScrambleKey] = useState(0)

  function handleMouseEnter() {
    setIsHovered(true)
    setScrambleKey(prev => prev + 1)
  }

  return (
    <li>
      <Link
        to={link.to}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary font-mono"
      >
        <span className="text-primary/50 transition-opacity duration-200 group-hover:opacity-100 opacity-30">/</span>
        <span className="relative">
          {isHovered ? (
            <DecryptText key={scrambleKey} text={link.label.toLowerCase()} delay={0} duration={400} />
          ) : (
            link.label.toLowerCase()
          )}
        </span>
      </Link>
    </li>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: FooterLink[]
}) {
  return (
    <div>
      <h3 className="mb-4 text-[0.65rem] tracking-[0.2em] text-foreground uppercase">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <FooterLinkItem key={link.to} link={link} />
        ))}
      </ul>
    </div>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface relative overflow-hidden">
      {/* Background Matrix/Glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,255,102,0.03),transparent_40%)] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Link to="/" className="group relative flex items-center gap-3 w-fit">
              {/* Ripple Effect */}
              <div className="absolute -left-2 -top-2 size-12 rounded-full bg-primary/0 transition-colors duration-500 group-hover:bg-primary/10 group-hover:animate-ping" style={{ animationDuration: '3s' }} />
              
              <img
                src="/assets/swentra-vault-logo-256.png"
                alt="Swentra Vault"
                className="relative z-10 size-8 rounded-md transition-all duration-300 group-hover:scale-110 shadow-[0_0_0_rgba(0,255,102,0)] group-hover:shadow-[0_0_15px_rgba(0,255,102,0.4)]"
              />
              <span className="text-sm font-semibold tracking-[0.18em] text-foreground transition-colors duration-300 group-hover:text-primary">
                SWENTRA VAULT
              </span>
            </Link>
            <p className="mt-6 font-mono text-xs leading-relaxed text-muted-foreground">
              Private banking, engineered for modern finance.
              <br />
              <span className="mt-2 inline-block text-primary/60">
                &copy; {YEAR} Swentra Vault.
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            <FooterColumn title="Product" links={PRODUCT_LINKS} />
            <FooterColumn title="Legal" links={LEGAL_LINKS} />
            <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          </div>
        </div>
      </div>

      {/* Live System Status Board Ticker */}
      <div className="relative mt-16 border-t border-border/50 bg-background py-2 overflow-hidden flex items-center z-10">
        {/* Glow lines framing the ticker */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <motion.div
          className="flex whitespace-nowrap text-[10px] font-mono text-primary/80 tracking-[0.15em]"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          <div className="flex gap-16 pr-16 items-center">
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)] animate-pulse" />
                {item}
              </span>
            ))}
          </div>
          <div className="flex gap-16 pr-16 items-center">
            {TICKER_ITEMS.map((item, i) => (
              <span key={i + 'copy'} className="flex items-center gap-3">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,102,0.8)] animate-pulse" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
