import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

interface DecryptTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  as?: React.ElementType;
}

export function DecryptText({
  text,
  className,
  speed = 30,
  delay = 0,
  as: Component = "span",
}: DecryptTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    
    // Start delay
    const startTimeout = setTimeout(() => {
      setHasStarted(true);
      let iteration = 0;
      
      const interval = setInterval(() => {
        setDisplayText(() => {
          return text
            .split("")
            .map((_, index) => {
              if (index < iteration) {
                return text[index];
              }
              return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
            })
            .join("");
        });

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3; // Slows down the decryption effect
      }, speed);
      
      timeout = interval;
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timeout) clearInterval(timeout);
    };
  }, [text, speed, delay]);

  return (
    <Component className={cn("font-mono", className)}>
      {hasStarted ? displayText : ""}
    </Component>
  );
}
