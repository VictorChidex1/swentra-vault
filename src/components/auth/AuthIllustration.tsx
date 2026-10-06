import { motion } from 'motion/react'

export function AuthIllustration() {
  return (
    <div className="relative hidden h-full w-full flex-col items-center justify-center overflow-hidden border-r border-white/5 bg-black lg:flex">
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.03)_0%,transparent_70%)]" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Abstract Cryptographic Hash / Vault Illusion */}
      <div className="relative z-10 flex h-[500px] w-[500px] items-center justify-center">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute h-full w-full rounded-full border border-white/10 border-t-primary/30 border-b-primary/30 border-dashed"
        />

        {/* Middle Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute h-[80%] w-[80%] rounded-full border border-white/10 border-l-primary/40 border-r-primary/40 border-dashed"
        />

        {/* Inner Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute h-[60%] w-[60%] rounded-full border border-primary/20 border-t-primary/60 border-b-primary/60 border-dotted"
        />

        {/* Center Node / Biometric Eye */}
        <div className="absolute h-[30%] w-[30%] rounded-full bg-black shadow-[0_0_40px_rgba(0,255,102,0.15)] flex items-center justify-center border border-primary/20">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="h-1/3 w-1/3 rounded-full bg-primary/40 shadow-[0_0_20px_rgba(0,255,102,0.8)]"
          />
        </div>

        {/* Orbital Nodes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute h-[110%] w-[110%]"
        >
          <div className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,255,102,1)]" />
        </motion.div>
      </div>

      {/* Floating System Stats overlay */}
      <div className="absolute bottom-12 left-12 z-20 flex flex-col gap-2 font-mono text-[10px] uppercase tracking-widest text-primary/40">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span>System Status: Optimal</span>
        </div>
        <div>Encryption: AES-256-GCM Active</div>
        <div>Network Node: SECURE-0X9A4</div>
        <div>Hash Rate: 4.2 TH/s</div>
      </div>
    </div>
  )
}
