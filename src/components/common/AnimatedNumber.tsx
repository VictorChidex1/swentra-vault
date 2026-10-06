import {
  animate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  format,
  duration = 0.8,
}: AnimatedNumberProps) {
  const reducedMotion = useReducedMotion();
  const count = useMotionValue(value);
  const text = useTransform(count, (current) => format(current));
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (reducedMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [value, duration, reducedMotion, count]);

  useEffect(() => {
    return text.on("change", (current) => setDisplay(current));
  }, [text]);

  return <span className="tabular-nums">{display}</span>;
}