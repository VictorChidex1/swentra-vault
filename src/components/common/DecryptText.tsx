import { useEffect, useState } from "react";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

interface DecryptTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function DecryptText({
  text,
  className = "",
  delay = 0,
  duration = 800,
}: DecryptTextProps) {
  const [displayText, setDisplayText] = useState(() => {
    let initialStr = "";
    for (let i = 0; i < text.length; i++) {
      if (text[i] === " " || text[i] === "," || text[i] === ".") {
        initialStr += text[i];
      } else {
        initialStr += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      }
    }
    return initialStr;
  });

  useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();

    const update = () => {
      const now = Date.now();

      if (now - startTime < delay) {
        let currentString = "";
        for (let i = 0; i < text.length; i++) {
          if (text[i] === " " || text[i] === "," || text[i] === ".") {
            currentString += text[i];
          } else {
            currentString +=
              CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          }
        }
        setDisplayText(currentString);
        animationFrame = requestAnimationFrame(update);
        return;
      }

      const revealStartTime = startTime + delay;
      const progress = Math.min((now - revealStartTime) / duration, 1);

      let currentString = "";
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " " || text[i] === "," || text[i] === ".") {
          currentString += text[i];
          continue;
        }

        const charProgressLimit = i / text.length;

        if (progress >= charProgressLimit) {
          currentString += text[i];
        } else {
          currentString +=
            CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
      }

      setDisplayText(currentString);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    animationFrame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [text, delay, duration]);

  return <span className={className}>{displayText}</span>;
}
