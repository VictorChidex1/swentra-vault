import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheckIcon, EyeOffIcon, DatabaseIcon, FingerprintIcon, Trash2Icon, TerminalSquareIcon } from 'lucide-react'
import { DecryptText } from '@/components/ui/decrypt-text'
import { SpotlightCard } from '@/components/ui/spotlight-card'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'zero-knowledge', title: '1. Zero-Knowledge Architecture' },
  { id: 'sharding', title: '2. Cryptographic Sharding' },
  { id: 'enclaves', title: '3. Identity Enclaves (KYC)' },
  { id: 'telemetry', title: '4. Ephemeral Telemetry' },
  { id: 'erasure', title: '5. Absolute Erasure' },
]

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('zero-knowledge')

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
              <EyeOffIcon className="size-4" /> Privacy Protocol
            </p>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-[1.1] mb-6">
            <DecryptText text="Zero-Knowledge" delay={200} speed={40} className="block font-sans" />
            <DecryptText text="Data Doctrine." delay={900} speed={40} className="block text-muted-foreground font-sans" />
          </h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="text-lg text-muted-foreground leading-relaxed"
          >
            Your financial telemetry is heavily obfuscated. We treat privacy not as a regulatory checkbox, but as a foundational cryptographic mandate. Swentra Vault cannot read what you do not explicitly decrypt.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 relative">
          
          {/* Sticky Sidebar */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Protocol Index</h3>
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
              id="zero-knowledge"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">01</span>
                Zero-Knowledge Architecture
              </h2>
              <div className="space-y-6">
                <p>
                  Unlike traditional institutions that warehouse your plaintext data, Swentra Vault operates on a Zero-Knowledge paradigm. Mathematical proofs allow our network to verify your transactions, balances, and identity status without ever decrypting the underlying payloads.
                </p>
                <SpotlightCard className="p-8 border-white/10 bg-[#0A0A0A] group">
                  <div className="flex items-center gap-4 mb-4">
                    <ShieldCheckIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">End-to-End Tunneling</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground mb-6">
                    All data transmitted between your local client and our core processors is wrapped in TLS 1.3 and heavily salted.
                  </p>
                  <div className="bg-black/80 rounded border border-white/5 p-4 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-primary/70 mb-1">$ tail -f /var/log/secure_tunnel</div>
                    <div className="text-muted-foreground">[SYS] Handshake established: Client &lt;-&gt; Node</div>
                    <div className="text-muted-foreground">[NET] Payload blind-signed. Contents unreadable by relay.</div>
                  </div>
                </SpotlightCard>
              </div>
            </motion.section>

            {/* Section 2 */}
            <motion.section 
              id="sharding"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">02</span>
                Cryptographic Sharding
              </h2>
              <div className="space-y-6">
                <p>
                  <DecryptText text="Data at rest does not exist as a single recognizable file." speed={20} className="inline" /> 
                  Instead, account ledgers and metadata are aggressively sharded. The fragments are encrypted via AES-256-GCM and distributed across geographically isolated cold-storage nodes. Compromising a single node yields nothing but mathematical noise.
                </p>
                <SpotlightCard className="p-8 border-white/10 bg-[#0A0A0A] group">
                  <div className="flex items-center gap-4 mb-4">
                    <DatabaseIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">Fragmented Storage Matrix</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground mb-6">
                    Reassembly of your ledger requires your hardware-specific decryption key, which is never transmitted to our servers.
                  </p>
                  <div className="bg-black/80 rounded border border-white/5 p-4 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-primary/70 mb-1">$ vault-shard --execute</div>
                    <div className="text-muted-foreground">[SEC] Ledger divided into 1,024 cryptographic fragments.</div>
                    <div className="text-muted-foreground">[NET] Dispersing to Nodes [EU-Central, AP-South, US-East]...</div>
                  </div>
                </SpotlightCard>
              </div>
            </motion.section>

            {/* Section 3 */}
            <motion.section 
              id="enclaves"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">03</span>
                Identity Enclaves (KYC)
              </h2>
              <div className="space-y-6">
                <p>
                  Global regulations demand compliance, but they do not demand insecure data hoarding. Government-issued identifiers (passports, national IDs, biometric matrices) are strictly routed into heavily restricted, air-gapped enclaves. 
                </p>
                <SpotlightCard className="p-8 border-primary/20 bg-primary/5 group">
                  <div className="flex items-center gap-4 mb-4">
                    <FingerprintIcon className="size-6 text-primary" />
                    <h3 className="text-xl font-medium text-white font-sans">Biometric Obfuscation</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground mb-6">
                    Identity documents are mathematically hashed into immutable digital signatures. Customer support agents see cryptographic verification status, never the raw documents.
                  </p>
                  <div className="bg-black/80 rounded border border-white/5 p-4 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-primary/70 mb-1">$ id_verify --hash --destroy-original</div>
                    <div className="text-muted-foreground">[AUTH] Document checksum validated against global ledger.</div>
                    <div className="text-muted-foreground">[SYS] Original image purged from RAM. Status: VERIFIED.</div>
                  </div>
                </SpotlightCard>
              </div>
            </motion.section>

             {/* Section 4 */}
             <motion.section 
              id="telemetry"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">04</span>
                Ephemeral Telemetry
              </h2>
              <div className="space-y-6">
                <p>
                  We do not utilize third-party tracking pixels, cross-site analytics, or external marketing telemetry. The limited operational telemetry generated during your session (e.g., latency metrics, crash logs) is entirely ephemeral. It is stripped of all identifiers, aggregated in memory, and flushed upon session termination.
                </p>
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl font-mono text-sm text-muted-foreground">
                  <span className="text-white font-bold">STRICT POLICY:</span> Swentra Vault strictly prohibits the monetization, leasing, or sharing of client transaction graphs with external algorithmic trading firms or advertising conglomerates.
                </div>
              </div>
            </motion.section>

            {/* Section 5 */}
            <motion.section 
              id="erasure"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="scroll-mt-32"
            >
              <h2 className="text-2xl font-sans font-medium text-foreground mb-6 flex items-center gap-4">
                <span className="text-primary font-mono text-sm bg-primary/10 px-2 py-1 rounded">05</span>
                Absolute Erasure
              </h2>
              <div className="space-y-6">
                <p>
                  You retain absolute sovereignty over your digital footprint. Upon execution of an account closure protocol, the network instantly invalidates your decryption keys.
                </p>
                <SpotlightCard className="p-8 border-destructive/20 bg-destructive/5 group">
                  <div className="flex items-center gap-4 mb-4">
                    <Trash2Icon className="size-6 text-destructive" />
                    <h3 className="text-xl font-medium text-white font-sans">Key Destruction Protocol</h3>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground mb-6">
                    Without your keys, the sharded fragments of your ledger immediately become mathematically permanently irretrievable—even by us. This achieves absolute erasure.
                  </p>
                  <div className="bg-black/80 rounded border border-white/5 p-4 font-mono text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="text-destructive/70 mb-1">$ sys_erase --target account_id --force</div>
                    <div className="text-muted-foreground">[SEC] Master decryption key pulverized.</div>
                    <div className="text-destructive font-bold">[SYS] ACCOUNT PERMANENTLY IRRETRIEVABLE.</div>
                  </div>
                </SpotlightCard>
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
              <span className="font-mono text-sm tracking-widest text-muted-foreground uppercase">End of Dossier</span>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  )
}