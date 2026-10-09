import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlobeLockIcon, FingerprintIcon, ActivityIcon, SearchIcon, FileSearchIcon, TerminalSquareIcon, ShieldCheckIcon } from 'lucide-react'
import { DecryptText } from '@/components/ui/decrypt-text'
import { TiltCard } from '@/components/ui/tilt-card'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'identity-verification', title: '1. Identity Verification' },
  { id: 'source-of-wealth', title: '2. Source of Wealth' },
  { id: 'transaction-monitoring', title: '3. Algorithmic Monitoring' },
  { id: 'sanctions-screening', title: '4. Sanctions Screening' },
  { id: 'regulatory-reporting', title: '5. Regulatory Reporting' },
]

const TICKER_MESSAGES = [
  "[LIVE] OFAC Watchlist Synced... 0 threats detected.",
  "[LIVE] Interpol Database Scanned... Secure.",
  "[LIVE] FinCEN Rule Updates Ingested...",
  "[LIVE] Cryptographic Node Integrity Confirmed.",
  "[LIVE] AML Algorithmic Heuristics Optimized..."
]

export default function CompliancePage() {
  const [activeSection, setActiveSection] = useState('identity-verification')
  const [tickerIndex, setTickerIndex] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200; 

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % TICKER_MESSAGES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-primary/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="flex items-center gap-2 text-xs font-mono tracking-[0.3em] text-primary uppercase bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              <GlobeLockIcon className="size-4" /> Defense Grid
            </div>
            
            {/* Live Ticker */}
            <div className="hidden md:flex flex-1 items-center bg-black/50 border border-white/10 rounded-full px-4 py-1.5 overflow-hidden">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-3 shrink-0" />
              <div className="relative w-full h-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 text-xs font-mono text-muted-foreground whitespace-nowrap"
                  >
                    {TICKER_MESSAGES[tickerIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-6">
            <DecryptText text="AML & KYC" delay={200} speed={40} className="block font-sans" />
            <DecryptText text="Compliance Framework." delay={900} speed={40} className="block text-muted-foreground font-sans" />
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            We view compliance not as administrative overhead, but as an active, cryptographic defense network. Swentra Vault aggressively intercepts illicit capital flows while rigorously defending the privacy of legitimate institutional clients.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 relative">
          
          {/* Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Defense Pillars</h3>
              <nav className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      const el = document.getElementById(section.id);
                      if (el) {
                        window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                      }
                    }}
                    className={cn(
                      "w-full flex items-center text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary translate-x-2"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-24 text-muted-foreground/80 font-serif text-lg leading-relaxed">
            
            {/* Section 1 */}
            <motion.section 
              id="identity-verification"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">01</span>
                Identity Verification
              </h2>
              <div className="space-y-6">
                <p>
                  To maintain the integrity of our network, we enforce a strict, mandatory Know Your Customer (KYC) protocol for all entities. We do not permit anonymous or untraceable ledger initialization.
                </p>
                <TiltCard className="p-8 border-white/10 bg-[#0A0A0A]" spotlightColor="rgba(34, 197, 94, 0.1)">
                  <div className="flex items-center gap-4 mb-4">
                    <FingerprintIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">Biometric Matrixing</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground">
                    Government-issued identification and live biometric capture are mathematically hashed against global identity graphs. Once identity is verified, raw imagery is purged, leaving only a cryptographic proof of identity.
                  </p>
                </TiltCard>
              </div>
            </motion.section>

            {/* Section 2 */}
            <motion.section 
              id="source-of-wealth"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">02</span>
                Source of Wealth
              </h2>
              <div className="space-y-6">
                <p>
                  Institutional accounts and high-net-worth nodes require absolute transparency regarding the origin of capital. Our defense grid automatically flags deposits that lack provable economic history.
                </p>
                <TiltCard className="p-8 border-white/10 bg-[#0A0A0A]" spotlightColor="rgba(34, 197, 94, 0.1)">
                  <div className="flex items-center gap-4 mb-4">
                    <SearchIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">Capital Provenance</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground">
                    For high-volume transfers, entities must provide audited financial statements, tax protocols, or corporate ownership structures (UBO). Illicit capital is intercepted and quarantined at the edge network.
                  </p>
                </TiltCard>
              </div>
            </motion.section>

            {/* Section 3 */}
            <motion.section 
              id="transaction-monitoring"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">03</span>
                Algorithmic Monitoring
              </h2>
              <div className="space-y-6">
                <p>
                  <DecryptText text="The ledger never sleeps." speed={20} className="inline" /> 
                  Our heuristic monitoring systems analyze capital flows in real-time, detecting anomalies, velocity spikes, and structured transaction patterns indicative of money laundering.
                </p>
                <TiltCard className="p-8 border-white/10 bg-[#0A0A0A]" spotlightColor="rgba(34, 197, 94, 0.1)">
                  <div className="flex items-center gap-4 mb-4">
                    <ActivityIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">Heuristic Defense Matrix</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground">
                    Behavioral algorithms map standard usage patterns. Deviations—such as rapid, high-frequency bridging across jurisdictions—trigger automated circuit breakers, temporarily freezing the node pending manual review.
                  </p>
                </TiltCard>
              </div>
            </motion.section>

             {/* Section 4 */}
             <motion.section 
              id="sanctions-screening"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">04</span>
                Sanctions Screening
              </h2>
              <div className="space-y-6">
                <p>
                  Swentra Vault strictly adheres to global sanctions frameworks. We do not process capital originating from, or destined for, sanctioned entities, states, or addresses.
                </p>
                <TiltCard className="p-8 border-destructive/20 bg-destructive/5" spotlightColor="rgba(239, 68, 68, 0.1)">
                  <div className="flex items-center gap-4 mb-4">
                    <ShieldCheckIcon className="size-6 text-destructive" />
                    <h3 className="text-xl font-medium text-white font-sans">Continuous Synchrony</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground">
                    Our databases synchronize directly with OFAC, UN, and Interpol watchlists continuously. Any node attempting interaction with a sanctioned vector is immediately suspended and reported to the relevant authorities.
                  </p>
                </TiltCard>
              </div>
            </motion.section>

            {/* Section 5 */}
            <motion.section 
              id="regulatory-reporting"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">05</span>
                Regulatory Reporting
              </h2>
              <div className="space-y-6">
                <p>
                  While we protect client privacy with cryptography, we do not shield illicit activity from law enforcement.
                </p>
                <TiltCard className="p-8 border-white/10 bg-[#0A0A0A]" spotlightColor="rgba(34, 197, 94, 0.1)">
                  <div className="flex items-center gap-4 mb-4">
                    <FileSearchIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">Suspicious Activity Reports</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground">
                    In compliance with the Bank Secrecy Act (BSA) and international equivalents, our intelligence team mandates the filing of Suspicious Activity Reports (SARs) upon detection of probable illicit flows.
                  </p>
                </TiltCard>
              </div>
            </motion.section>

            {/* Terminal Block */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-32 p-8 border border-white/10 bg-black/50 rounded-2xl flex items-center justify-center gap-4"
            >
              <TerminalSquareIcon className="size-5 text-muted-foreground" />
              <span className="font-mono text-sm tracking-widest text-muted-foreground uppercase">Grid Status: Secured</span>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  )
}
