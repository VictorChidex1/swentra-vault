import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { DecryptText } from '@/components/ui/decrypt-text'
import { ShieldCheckIcon, Globe2Icon, FingerprintIcon, LockIcon } from 'lucide-react'

const BackgroundVault = () => (
  <div className="fixed inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden mix-blend-screen">
    <motion.svg
      width="1200"
      height="1200"
      viewBox="0 0 100 100"
      className="absolute text-primary"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.2" fill="none" />
      <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="1 2" />
      <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.1" fill="none" />
      <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="0.2" fill="none" />
      {/* Target reticle lines */}
      <path d="M50 0 L50 15 M50 85 L50 100 M0 50 L15 50 M85 50 L100 50" stroke="currentColor" strokeWidth="0.3" />
      {/* Outer notches */}
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="50" y1="5" x2="50" y2="8"
          stroke="currentColor" strokeWidth="0.5"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
    </motion.svg>
  </div>
)

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden selection:bg-primary/30">
      <BackgroundVault />

      {/* Laser Sweep Intro Effect */}
      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        className="fixed inset-x-0 h-[2px] bg-primary/80 shadow-[0_0_20px_rgba(34,197,94,0.8)] z-50 pointer-events-none mix-blend-screen"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        
        {/* HERO SECTION */}
        <div className="max-w-3xl mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <p className="text-xs font-mono tracking-[0.3em] text-primary mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
              SYSTEM OVERVIEW
            </p>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight text-foreground leading-[1.1]">
            <DecryptText text="A calmer way to hold" delay={800} speed={40} className="block font-sans" />
            <DecryptText text="and move money." delay={1600} speed={40} className="block text-muted-foreground font-sans" />
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.8 }}
            className="mt-8 text-lg font-mono text-muted-foreground leading-relaxed max-w-2xl"
          >
            Swentra Vault is a highly secure, private-banking architecture engineered for modern, multi-currency liquidity. Clear, calm, and fully in your control.
          </motion.p>
        </div>

        {/* BENTO BOX GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          
          {/* Card 1: Transparency */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.15)" className="h-full p-8 flex flex-col justify-between">
              <div>
                <Globe2Icon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Radical Transparency</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every fee and exchange rate is cryptographically locked and displayed before you confirm. We eliminate spread obfuscation entirely.
                </p>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 2: Control */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.15)" className="h-full p-8 flex flex-col justify-between">
              <div>
                <FingerprintIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Uncompromising Control</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You choose the exact routing. Every outbound wire is authorised with an encrypted Transaction PIN, keeping you as the sole arbiter of your funds.
                </p>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 3: Clarity */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.15)" className="h-full p-8 flex flex-col justify-between">
              <div>
                <ShieldCheckIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Absolute Clarity</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Plain language layered over structured, institutional-grade financial data. You always know exactly what is happening with your liquidity.
                </p>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 4: Multi-currency (Large) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="md:col-span-2">
            <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.15)" className="h-full p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="text-2xl font-medium text-foreground mb-4">Multi-Currency, Handled Natively</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Instead of a single balance where you toggle between volatile conversions, Swentra Vault provisions dedicated settlement accounts for each currency—CHF, USD, EUR, and NGN. You always hold the native asset.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-shrink-0 w-full md:w-auto">
                  {['CHF', 'USD', 'EUR', 'NGN'].map((currency) => (
                    <div key={currency} className="border border-white/5 bg-black/50 rounded-lg p-4 text-center font-mono">
                      <span className="text-primary text-sm">{currency}</span>
                      <div className="text-xs text-muted-foreground mt-1">NATIVE</div>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Card 5: Security */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
            <SpotlightCard spotlightColor="rgba(34, 197, 94, 0.15)" className="h-full p-8 flex flex-col justify-center items-center text-center">
              <LockIcon className="size-8 text-primary mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Military Grade Security</h3>
              <p className="text-sm text-muted-foreground">
                Zero-trust architecture with continuous session monitoring.
              </p>
            </SpotlightCard>
          </motion.div>

        </div>

        {/* CTA SECTION */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-12 border-t border-white/10"
        >
          <Button asChild size="lg" className="h-12 px-8 text-sm font-mono tracking-wider w-full sm:w-auto">
            <Link to="/register">INITIALIZE ACCOUNT</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-sm font-mono tracking-wider w-full sm:w-auto bg-transparent border-white/20 hover:bg-white/5">
            <Link to="/security">VIEW SECURITY PROTOCOLS</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
