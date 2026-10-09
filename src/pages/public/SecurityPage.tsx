import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { TiltCard } from '@/components/ui/tilt-card'
import { DecryptText } from '@/components/ui/decrypt-text'
import { SystemErrorBoundary } from '@/components/error/SystemErrorBoundary'
import { LockIcon, FingerprintIcon, ShieldCheckIcon, HardDriveIcon, ActivityIcon, NetworkIcon } from 'lucide-react'

const TERMINAL_LOGS = [
  "[SYS] Initialising secure boot sequence...",
  "[AUTH] TLS 1.3 Handshake completed successfully.",
  "[NET] Verifying end-to-end encryption tunnel...",
  "[NET] Tunnel established. Cipher: AES-256-GCM.",
  "[SYS] Zero-Trust architecture enforced.",
  "[AUTH] Checking biometric signatures...",
  "[AUTH] Identity verification (KYC) matrix loaded.",
  "[DB] Accessing immutable ledger...",
  "[DB] Encrypted document enclave mounted.",
  "[NET] Continuous session monitoring active.",
  "[SYS] System locked. Impenetrable mode engaged."
]

function LiveTerminal() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    let currentIndex = 0
    
    const interval = setInterval(() => {
      if (currentIndex < TERMINAL_LOGS.length) {
        setLogs(prev => [...prev, TERMINAL_LOGS[currentIndex]])
        currentIndex++
      } else {
        if (Math.random() > 0.7) {
          setLogs(prev => {
            const newLogs = [...prev, `[NET] Heartbeat ping latency: ${Math.floor(Math.random() * 5 + 1)}ms`]
            return newLogs.slice(Math.max(newLogs.length - 12, 0))
          })
        }
      }
    }, 800)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="font-mono text-xs text-primary/70 bg-[#050505] border border-white/10 rounded-xl p-4 h-[350px] overflow-hidden flex flex-col justify-end relative shadow-[0_0_15px_rgba(34,197,94,0.05)] hidden lg:flex">
      <div className="absolute top-0 left-0 w-full p-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
        <div className="size-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] tracking-widest text-muted-foreground">SECURE_TERMINAL_V9</span>
      </div>
      <div className="space-y-2 pb-2">
        {logs.map((log, i) => {
          if (!log) return null;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="break-all"
            >
              <span className="text-muted-foreground/50 mr-2">{new Date().toISOString().split('T')[1].split('.')[0]}</span>
              <span className={log.includes('[AUTH]') ? 'text-blue-400' : log.includes('[NET]') ? 'text-primary' : 'text-white/70'}>
                {log}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#050505] selection:bg-primary/30 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="grid lg:grid-cols-12 gap-12 items-end mb-20">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <p className="text-xs font-mono tracking-[0.3em] text-primary mb-4 flex items-center gap-2 uppercase">
                <ShieldCheckIcon className="size-4" /> Security Architecture
              </p>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1]">
              <DecryptText text="Institutional-Grade" delay={500} speed={40} className="block font-sans" />
              <DecryptText text="Infrastructure." delay={1200} speed={40} className="block text-muted-foreground font-sans" />
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.8 }}
              className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              No fluff, no jargon. Swentra Vault is fortified by military-grade cryptography, absolute zero-trust protocols, and hardware-secured validation limits.
            </motion.p>
          </div>
          
          <div className="lg:col-span-5 h-[350px]">
            <SystemErrorBoundary level="widget">
              <LiveTerminal />
            </SystemErrorBoundary>
          </div>
        </div>

        {/* 3D TILT GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 perspective-[1000px]">
          
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <TiltCard className="h-full p-8 flex flex-col justify-between">
              <div>
                <NetworkIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Zero-Trust Architecture</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every session is cryptographically bound to your verified identity. We do not trust devices; we explicitly verify every network handshake.
                </p>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <TiltCard className="h-full p-8 flex flex-col justify-between">
              <div>
                <LockIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Cryptographic Authorisation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transfers cannot be executed without a physical 6-digit Transaction PIN, stored separately from your primary login credentials in a hashed vault.
                </p>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <TiltCard className="h-full p-8 flex flex-col justify-between">
              <div>
                <FingerprintIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Regulated KYC</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your identity is reviewed against global compliance matrices before transacting. This ensures absolute network integrity and fraud prevention.
                </p>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <TiltCard className="h-full p-8 flex flex-col justify-between">
              <div>
                <HardDriveIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Encrypted Document Enclave</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your identity documents are instantly encrypted using AES-256 and stored in an isolated, non-public storage bucket accessible only by authorised compliance officers.
                </p>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
            <TiltCard className="h-full p-8 flex flex-col justify-between">
              <div>
                <ActivityIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Immutable Audit Logs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every action—from login to wire settlement—is recorded in an immutable ledger. You can review and export your complete transaction history securely at any time.
                </p>
              </div>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
            <TiltCard className="h-full p-8 flex flex-col justify-between">
              <div>
                <ShieldCheckIcon className="size-6 text-primary mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">Sovereign Accounts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unlike traditional ledgers, your liquidity is segregated into native currency accounts, giving you absolute control over when to hold and when to route funds.
                </p>
              </div>
            </TiltCard>
          </motion.div>

        </div>

        {/* CTA SECTION */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-12 border-t border-white/10"
        >
          <Button asChild size="lg" className="h-12 px-8 text-sm font-mono tracking-wider w-full sm:w-auto">
            <Link to="/register">INITIALIZE SECURE ACCOUNT</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-sm font-mono tracking-wider w-full sm:w-auto bg-transparent border-white/20 hover:bg-white/5">
            <Link to="/about">VIEW SYSTEM ARCHITECTURE</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}