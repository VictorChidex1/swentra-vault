import { useState, useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "motion/react";

import { Button } from "@/components/ui/button";
import { DecryptText } from "@/components/common/DecryptText";
import { cn } from "@/lib/utils";

const LOGS = [
  "[SYSTEM] Kernel boot sequence initiated...",
  "[SYSTEM] Memory integrity verification: PASSED",
  "[NETWORK] Establishing secure TLS 1.3 tunnel...",
  "[NETWORK] Handshake complete. Cipher: AES-256-GCM",
  "[AUTH] Cryptographic entropy pool loaded. (8192 bits)",
  "[VAULT] Synchronizing ledger state across nodes...",
  "[VAULT] Block height verified: 8,439,012",
  "[VAULT] Awaiting incoming client connection...",
  "[ROUTER] Inbound request routed via secure gateway.",
  "[SYSTEM] Allocating dedicated sub-process for session.",
];

function Typewriter({
  text,
  onComplete,
  delay = 0,
}: {
  text: string;
  onComplete?: () => void;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setTimeout>;

    timeout = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i === text.length) {
          clearInterval(interval);
          if (onComplete) onComplete();
        }
      }, 40);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, delay]);

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{
          repeat: Infinity,
          duration: 0.8,
          times: [0, 0.5, 0.5, 1],
        }}
        className="inline-block h-[1em] w-[10px] align-middle bg-primary ml-1 shadow-[0_0_8px_rgba(0,255,102,0.8)]"
      />
    </span>
  );
}

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [typingDone, setTypingDone] = useState(false);

  // Background Parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const backgroundY = useTransform(mouseY, [-0.5, 0.5], ["-5%", "5%"]);
  const backgroundX = useTransform(mouseX, [-0.5, 0.5], ["-2%", "2%"]);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden border-t border-white/5 bg-background"
    >
      {/* Background Matrix Logs */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.03] flex justify-center"
        style={{ x: backgroundX, y: backgroundY }}
      >
        <div className="font-mono text-[10px] text-primary whitespace-nowrap leading-[2.5] pt-10">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i}>{LOGS[i % LOGS.length]}</div>
          ))}
        </div>
      </motion.div>

      {/* Radial fade to blend background edges */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,10,1)_80%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-32 text-center sm:px-6 lg:px-8">
        <motion.div
          onViewportEnter={() => setHasEntered(true)}
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Terminal Command */}
          <div className="mb-8 font-mono text-sm text-primary flex items-center justify-center min-h-[24px]">
            {hasEntered && (
              <Typewriter
                text="> initialize_vault_sequence --user new"
                delay={200}
                onComplete={() => setTypingDone(true)}
              />
            )}
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {typingDone ? (
              <DecryptText
                text="Open your Swentra Vault account."
                delay={0}
                duration={800}
              />
            ) : (
              <span className="opacity-0">
                Open your Swentra Vault account.
              </span>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {typingDone ? (
              <DecryptText
                text="Multi-currency banking with transfers you can see through — start in minutes."
                delay={400}
                duration={800}
              />
            ) : (
              <span className="opacity-0">
                Multi-currency banking with transfers you can see through —
                start in minutes.
              </span>
            )}
          </p>

          <div
            className={cn(
              "mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-1000",
              typingDone
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4 pointer-events-none",
            )}
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto min-w-[200px] shadow-[0_0_15px_rgba(0,255,102,0.15)] transition-all hover:shadow-[0_0_25px_rgba(0,255,102,0.3)]"
            >
              <Link to="/register">Open an account</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto min-w-[200px] border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Link to="/login">Access your account</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
