import { useState, useRef } from "react";
import type { MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
} from "motion/react";

import { Reveal } from "@/components/common/Reveal";
import { SectionHeading } from "@/components/common/SectionHeading";
import { DecryptText } from "@/components/common/DecryptText";

const STEPS = [
  {
    title: "Open an account",
    body: "Create your account and confirm your email address.",
  },
  {
    title: "Verify your identity",
    body: "Complete KYC by sharing your details and identity document.",
  },
  {
    title: "Fund your accounts",
    body: "Hold CHF, USD, EUR and NGN in separate currency accounts.",
  },
  {
    title: "Send and keep a receipt",
    body: "Transfer with a clear quote, confirm with your Transaction PIN, and keep the receipt.",
  },
];

function BentoCard({
  step,
  index,
  className,
}: {
  step: (typeof STEPS)[0];
  index: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  // 3D Tilt State
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for the 3D tilt
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Transform coordinates into rotation angles
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

  // Spotlight State
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
    spotlightX.set(mouseX);
    spotlightY.set(mouseY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const numberString = String(index + 1).padStart(2, "0");

  return (
    <Reveal delay={index * 0.1} className={className}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onViewportEnter={() => setHasEntered(true)}
        viewport={{ once: true, margin: "-50px" }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-surface p-8 transition-colors duration-300 hover:border-primary/20 hover:bg-surface/80"
      >
        {/* Spotlight Glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                600px circle at ${spotlightX}px ${spotlightY}px,
                rgba(0, 255, 102, 0.05),
                transparent 80%
              )
            `,
          }}
        />

        {/* Massive Watermark Number */}
        <div
          className="pointer-events-none absolute -bottom-10 -right-4 z-0 select-none text-[150px] font-black leading-none tracking-tighter text-white/[0.02] transition-colors duration-500 group-hover:text-primary/[0.05]"
          style={{ transform: "translateZ(10px)" }}
        >
          {numberString}
        </div>

        {/* Content */}
        <div
          className="relative z-10 flex h-full flex-col justify-between"
          style={{ transform: "translateZ(30px)" }}
        >
          <span className="mb-12 inline-block text-xs font-bold tracking-[0.2em] text-primary">
            {numberString}
          </span>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {hasEntered ? (
                <DecryptText text={step.title} delay={100} duration={800} />
              ) : (
                step.title
              )}
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {hasEntered ? (
                <DecryptText text={step.body} delay={300} duration={800} />
              ) : (
                step.body
              )}
            </p>
          </div>
        </div>
      </motion.div>
    </Reveal>
  );
}

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="How Swentra works"
          title="Four steps from sign-up to your first transfer."
        />
      </Reveal>

      <div
        className="mt-16 grid gap-6 md:grid-cols-3 md:grid-rows-2"
        style={{ perspective: "2000px" }}
      >
        <BentoCard
          step={STEPS[0]}
          index={0}
          className="md:col-span-2 md:min-h-[300px]"
        />
        <BentoCard
          step={STEPS[1]}
          index={1}
          className="md:col-span-1 md:min-h-[300px]"
        />
        <BentoCard
          step={STEPS[2]}
          index={2}
          className="md:col-span-1 md:min-h-[300px]"
        />
        <BentoCard
          step={STEPS[3]}
          index={3}
          className="md:col-span-2 md:min-h-[300px]"
        />
      </div>
    </section>
  );
}
