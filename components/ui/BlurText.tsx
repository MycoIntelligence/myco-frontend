import React from "react";
import { cn } from "@/lib/cn";

interface BlurTextProps {
  lines: string[];
  className?: string;
}

export function BlurText({ lines, className }: BlurTextProps) {
  const fullText = lines.join(" ");
  let runningIndex = 0;

  return (
    <h1
      aria-label={fullText}
      className={cn(
        "font-sans text-[clamp(40px,6.4vw,108px)] font-normal leading-[0.98] tracking-[-0.035em] uppercase text-[#cbe1df] select-none text-center",
        "[text-shadow:0_0_28px_rgba(203,225,227,0.45),0_0_2px_rgba(203,225,227,0.85)]",
        className
      )}
    >
      {lines.map((line, lineIdx) => {
        const words = line.split(" ");
        return (
          <span key={lineIdx} className="block">
            {words.map((word, wordIdx) => {
              const chars = Array.from(word);
              const wordNode = (
                <span
                  key={wordIdx}
                  className="inline-block whitespace-nowrap"
                  aria-hidden="true"
                >
                  {chars.map((char, charIdx) => {
                    const currentIndex = runningIndex++;
                    return (
                      <span
                        key={charIdx}
                        style={
                          {
                            ["--i" as string]: currentIndex,
                          } as React.CSSProperties
                        }
                        className="bt-char"
                      >
                        {char}
                      </span>
                    );
                  })}
                  {wordIdx < words.length - 1 && (
                    <span
                      style={
                        {
                          ["--i" as string]: runningIndex++,
                        } as React.CSSProperties
                      }
                      className="bt-char"
                    >
                      {" "}
                    </span>
                  )}
                </span>
              );
              return wordNode;
            })}
          </span>
        );
      })}
    </h1>
  );
}

