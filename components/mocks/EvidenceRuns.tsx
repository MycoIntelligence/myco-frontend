"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function EvidenceRuns({ active = true }: { active?: boolean }) {
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setCompleted(false);
      return;
    }

    const start = performance.now();
    const duration = 2400;

    let rafId: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p * 100);

      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCompleted(true);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);

  return (
    <div className="w-[360px] sm:w-[390px] bg-[#efeeea] border border-[#d5d5cf] rounded-[10px] p-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_32px_rgba(22,24,28,0.18)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between font-mono text-[11px] pb-2 border-b border-[#d5d5cf]">
        <span className="font-semibold text-[#16181c]">context validation</span>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              completed ? "bg-[#4fa36b]" : "bg-[#c9983c]"
            )}
          />
          <span className="text-[#16181c] font-medium">
            {completed ? "3/3 validated" : "2/3 checks"}
          </span>
        </div>
      </div>

      {/* Runs */}
      <div className="flex flex-col gap-3 my-3 font-mono text-[11px]">
        {/* Run 01: AST Call Graph */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[#16181c]">
            <span className="text-[#71747b]">AST call graph</span>
            <span className="text-[#4fa36b] flex items-center gap-1">
              <CheckCircle2 size={11} /> 1,284 nodes
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#d5d5cf] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[#0e946e]" />
          </div>
        </div>

        {/* Run 02: Jira Acceptance Match */}
        <div className="flex justify-between text-[#16181c]">
          <span className="text-[#71747b]">Intent check</span>
          <span className="text-[#4fa36b] flex items-center gap-1">
            <CheckCircle2 size={11} /> matched criteria
          </span>
        </div>
        <div className="w-full h-[3px] bg-[#d5d5cf] rounded-full overflow-hidden">
          <div className="w-full h-full bg-[#0e946e]" />
        </div>

        {/* Run 03: Regression Signal */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[#16181c]">
            <span className="text-[#71747b]">Assertion strength</span>
            <span className={completed ? "text-[#c0553c] font-semibold" : "text-[#c9983c]"}>
              {completed ? "gap detected" : "analyzing..."}
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#d5d5cf] rounded-full overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-[#c0553c] transition-all ease-linear"
            />
          </div>
        </div>
      </div>

      {/* Footer Chips */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#d5d5cf] font-mono text-[10px]">
        <div className="inline-flex items-center gap-1.5 h-[24px] px-2.5 rounded bg-[#e9e9e5] border border-[#d5d5cf] text-[#16181c]">
          <ShieldCheck size={12} strokeWidth={1.5} className="text-[#0e946e]" />
          <span>zero model training</span>
        </div>
        <div className="inline-flex items-center h-[24px] px-2.5 rounded bg-[#e9e9e5] border border-[#d5d5cf] text-[#71747b]">
          <span>read-only AST</span>
        </div>
      </div>
    </div>
  );
}
