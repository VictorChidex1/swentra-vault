import { useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";

import { Button } from "@/components/ui/button";
import { DecryptText } from "@/components/common/DecryptText";

export function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <section
      className="relative mx-auto w-full overflow-hidden border-b border-border/50 bg-background"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Option 2: Ambient Topography & Spotlight */}
      <div className="absolute inset-0 z-0">
        {/* Terminal Dot Grid */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, #000 30%, transparent 100%)",
          }}
        />

        {/* Interactive Mouse Spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: useMotionTemplate`
              radial-gradient(
                500px circle at ${mouseX}px ${mouseY}px,
                rgba(0, 255, 102, 0.05),
                transparent 80%
              )
            `,
          }}
        />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 pt-20 pb-20 text-center sm:px-6 lg:px-8 lg:pt-32">
        {/* Boot Sequence: Step 1 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md">
            <motion.span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            Banking technology
          </span>
        </motion.div>

        {/* Option 1: Encrypted Boot Sequence on Heading */}
        <h1 className="mx-auto mt-8 max-w-4xl text-4xl leading-tight font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl min-h-[96px] sm:min-h-[120px] lg:min-h-[144px]">
          <DecryptText
            text="Private banking, engineered for modern finance."
            delay={400}
            duration={1200}
          />
        </h1>

        {/* Boot Sequence: Step 2 */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: "easeOut" }}
        >
          A secure, multi-currency account with clear transfers. See every fee,
          every rate and every step — from the moment you send to the receipt
          you keep.
        </motion.p>

        {/* Boot Sequence: Step 3 */}
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.6, ease: "easeOut" }}
        >
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto shadow-[0_0_30px_rgba(0,255,102,0.15)] transition-shadow hover:shadow-[0_0_40px_rgba(0,255,102,0.3)]"
          >
            <Link to="/register">Open an account</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-border/50 bg-surface/30 backdrop-blur-md hover:bg-white/5 hover:border-border"
          >
            <Link to="/login">Access your account</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
