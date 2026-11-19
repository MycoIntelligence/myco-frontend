"use client";

import React from "react";
import { GitPullRequest, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function DiffCard() {
  return (
    <div className="w-[360px] sm:w-[390px] bg-[#efeeea] border border-[#d5d5cf] rounded-[10px] p-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_32px_rgba(22,24,28,0.18)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between font-mono text-[11px] pb-2 border-b border-[#d5d5cf]">
        <div className="flex items-center gap-1.5 text-[#16181c] font-medium truncate max-w-[240px]">
          <GitPullRequest size={12} className="text-[#0e946e] shrink-0" />
          <span className="truncate">agent-runner.ts:48</span>
        </div>
        <span className="text-[#c0553c] font-semibold shrink-0 text-[10px] bg-[rgba(192,85,60,0.1)] px-1.5 py-0.5 rounded border border-[#c0553c]/40">
          P0 finding
        </span>
      </div>

      {/* Code Block */}
      <div className="my-3 font-mono text-[11px] leading-[1.6] bg-[#e9e9e5] rounded border border-[#d5d5cf] overflow-hidden">
        <div className="bg-[rgba(192,85,60,0.12)] border-l-2 border-[#c0553c] px-2 text-[#c0553c]">
          <span>-    if (toolPolicy.requiresApproval(tool)) &#123;</span>
        </div>
        <div className="bg-[rgba(14,148,110,0.08)] border-l-2 border-[#0e946e] px-2 text-[#0a7c5c]">
          <span>+    // retry executes without approval</span>
        </div>
        <div className="px-2 text-[#71747b]">
          <span>     await executeTool(tool, payload);</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="pt-2 border-t border-[#d5d5cf] flex items-center justify-between font-mono text-[11px]">
        <div className="flex items-center gap-1 text-[10px] text-[#71747b]">
          <span>AGENT-12</span>
          <ArrowRight size={10} />
          <span>AST trace</span>
          <ArrowRight size={10} />
          <span className="text-[#c0553c] font-medium">Bypass</span>
        </div>
        <span className="text-[#0a7c5c] text-[10px] font-medium">evidence ready</span>
      </div>
    </div>
  );
}
