import { useEffect, useState, useRef } from "react";
import { animate, useMotionValue, useTransform, useReducedMotion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface LiveTelemetryNumberProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
  enableFluctuation?: boolean;
}

export function LiveTelemetryNumber({
  value,
  format,
  duration = 1.2,
  className,
  enableFluctuation = true,
}: LiveTelemetryNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });
  
  const reducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const text = useTransform(count, (current) => format(current));
  const [display, setDisplay] = useState(() => format(0));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (reducedMotion || !isInView) {
      if (reducedMotion && isInView) {
        count.set(value);
      }
      return;
    }

    // Phase 1: Scrub up from 0 to target value when scrolled into view
    const controls = animate(count, value, {
      duration,
      ease: [0.16, 1, 0.3, 1], // Custom out-expo ease for that premium lock-in feel
      onComplete: () => {
        if (!enableFluctuation) return;
        
        const baseValue = Math.floor(value);
        
        // Phase 2: Live telemetry fluctuation (simulating live financial data)
        const fluctuate = () => {
          // Randomize just the cents to keep the main balance stable but feeling alive
          const randomCents = Math.floor(Math.random() * 100) / 100;
          const newValue = baseValue + randomCents;
          
          animate(count, newValue, {
            duration: 0.3,
            ease: "easeInOut",
          });
          
          // Next fluctuation anywhere from 1s to 4s
          timeoutId = setTimeout(fluctuate, 1000 + Math.random() * 3000);
        };
        
        timeoutId = setTimeout(fluctuate, 1500);
      }
    });

    return () => {
      controls.stop();
      clearTimeout(timeoutId);
    };
  }, [value, duration, reducedMotion, count, enableFluctuation, isInView]);

  useEffect(() => {
    return text.on("change", (current) => setDisplay(current));
  }, [text]);

  return (
    <span ref={ref} className={cn("tabular-nums tracking-tight text-foreground", className)}>
      {display}
    </span>
  );
}
