import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, FileSignatureIcon, LockIcon, ShieldAlertIcon } from 'lucide-react'
import { DecryptText } from '@/components/ui/decrypt-text'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'agreement', title: '1. Master Services Agreement' },
  { id: 'custody', title: '2. Institutional Custody' },
  { id: 'zero-trust', title: '3. Zero-Trust Protocols' },
  { id: 'compliance', title: '4. KYC & AML Compliance' },
  { id: 'liability', title: '5. Limitation of Liability' },
  { id: 'jurisdiction', title: '6. Governance & Jurisdiction' },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('agreement')
  const [signatureState, setSignatureState] = useState<'idle' | 'signing' | 'signed'>('idle')
  const [hash, setHash] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map(s => document.getElementById(s.id));
      // Add a small offset so it triggers slightly before hitting the exact top
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

  const handleSign = () => {
    if (signatureState !== 'idle') return;
    setSignatureState('signing')
    setTimeout(() => {
      setHash(`0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()}`)
      setSignatureState('signed')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-primary/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <p className="text-xs font-mono tracking-[0.3em] text-primary mb-4 flex items-center gap-2 uppercase">
              <ShieldAlertIcon className="size-4" /> Legal Dossier
            </p>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-6">
            <DecryptText text="Master Services" delay={200} speed={40} className="block font-sans" />
            <DecryptText text="Agreement." delay={900} speed={40} className="block text-muted-foreground font-sans" />
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            This document outlines the cryptographic obligations, custodial parameters, and strict zero-trust operational mandates governing your access to the Swentra Vault institutional network.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 relative">
          
          {/* Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Table of Contents</h3>
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
              id="agreement"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">01</span>
                Master Services Agreement
              </h2>
              <div className="space-y-6">
                <p>
                  This Master Services Agreement ("Agreement") governs your access to and use of Swentra Vault's secure financial infrastructure, cryptographic networks, and institutional custody protocols. By generating access keys, biometrically authenticating, or executing transactions within the network, you legally bind yourself and your represented entity to these strict mandates.
                </p>
                <p>
                  Swentra Vault operates exclusively as an institutional-grade infrastructure provider. We do not engage in fractional reserve lending, hypothecation, or unauthorized deployment of client assets.
                </p>
              </div>
            </motion.section>

            {/* Section 2 */}
            <motion.section 
              id="custody"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">02</span>
                Institutional Custody
              </h2>
              <div className="space-y-6">
                <p>
                  All assets deposited into the Swentra Vault network are secured via heavily audited, geographically distributed cold-storage enclaves. The Vault utilizes a multi-signature validation paradigm requiring hardware-backed quorum consensus for all outward fund migrations.
                </p>
                <div className="p-6 bg-primary/5 border border-primary/10 rounded-xl font-mono text-sm text-primary/80">
                  <span className="text-primary font-bold">PROTOCOL OVERRIDE:</span> Under no circumstances can Swentra Vault personnel independently access, reverse, or seize properly authenticated client funds without multi-jurisdictional legal mandates and cryptographic quorum.
                </div>
              </div>
            </motion.section>

            {/* Section 3 */}
            <motion.section 
              id="zero-trust"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">03</span>
                Zero-Trust Security
              </h2>
              <div className="space-y-6">
                <p>
                  We operate on an absolute zero-trust framework. The network continuously assumes compromise and mathematically verifies every session, API call, and internal microservice request. 
                </p>
                <p>
                  Clients are solely responsible for maintaining the physical and digital integrity of their authentication hardware, seed phrases, and biometric matrices. Swentra Vault bears zero liability for assets compromised due to client-side social engineering, hardware extraction, or unauthorized delegation of access credentials.
                </p>
              </div>
            </motion.section>

             {/* Section 4 */}
             <motion.section 
              id="compliance"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">04</span>
                KYC & AML Compliance
              </h2>
              <div className="space-y-6">
                <p>
                  In accordance with global financial regulatory mandates, all Swentra Vault accounts are subject to rigorous, continuous Know Your Customer (KYC) and Anti-Money Laundering (AML) screenings. We utilize on-chain forensics, behavior pattern analysis, and global watchlist synchronization to interdict illicit capital flows.
                </p>
                <p>
                  Failure to provide cryptographic proof of identity or source of funds upon request will result in immediate network quarantine of the offending node and associated assets.
                </p>
              </div>
            </motion.section>

            {/* Section 5 */}
            <motion.section 
              id="liability"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">05</span>
                Limitation of Liability
              </h2>
              <div className="space-y-6">
                <p>
                  Swentra Vault, its directors, cryptographers, and affiliates shall not be liable for any indirect, incidental, or consequential damages arising out of network latency, consensus failures, global internet outages, or acts of cyber-warfare. 
                </p>
                <p>
                  Our maximum aggregate liability, regardless of the form of action, shall be strictly limited to the total infrastructure fees paid by the client in the three (3) months preceding the inciting incident.
                </p>
              </div>
            </motion.section>

            {/* Section 6 */}
            <motion.section 
              id="jurisdiction"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">06</span>
                Governance & Jurisdiction
              </h2>
              <div className="space-y-6">
                <p>
                  This Agreement shall be governed by, and construed in accordance with, the laws of the jurisdiction of Geneva, Switzerland, exclusive of conflict or choice of law rules. Any dispute resolution will be conducted via binding arbitration in a secure, closed-door tribunal.
                </p>
              </div>
            </motion.section>

            {/* Signature Block */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mt-32 p-8 md:p-12 border border-primary/20 bg-primary/5 rounded-3xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <h3 className="text-xl font-medium text-foreground mb-2 flex items-center gap-3">
                  <FileSignatureIcon className="size-5 text-primary" />
                  Cryptographic Acknowledgement
                </h3>
                <p className="text-sm font-sans text-muted-foreground mb-8 max-w-xl">
                  By executing this signature sequence, you acknowledge absolute comprehension of the Zero-Trust mandates and legally bind your entity to the institutional parameters defined above.
                </p>

                {signatureState === 'idle' && (
                  <Button 
                    onClick={handleSign}
                    size="lg"
                    className="font-mono tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Generate Signature Hash
                  </Button>
                )}

                {signatureState === 'signing' && (
                  <div className="flex items-center gap-4 text-primary font-mono text-sm">
                    <LockIcon className="size-4 animate-pulse" />
                    <span>Computing cryptographic proof...</span>
                  </div>
                )}

                {signatureState === 'signed' && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-black/50 border border-primary/30 rounded-xl p-6"
                  >
                    <div className="flex items-center gap-3 text-green-500 mb-4">
                      <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckIcon className="size-5" />
                      </div>
                      <span className="font-medium tracking-wide">AGREEMENT DIGITALLY SIGNED</span>
                    </div>
                    <div className="space-y-2 font-mono text-xs text-muted-foreground break-all">
                      <p><span className="text-white/40">TIMESTAMP:</span> {new Date().toISOString()}</p>
                      <p><span className="text-white/40">NODE_IP:</span> [SECURE_ENCLAVE_MASKED]</p>
                      <p><span className="text-white/40">SIGNATURE_HASH:</span> <span className="text-primary">{hash}</span></p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  )
}