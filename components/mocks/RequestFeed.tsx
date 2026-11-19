"use client";

import React from "react";
import { GitPullRequest, FileCode2, ShieldAlert } from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";
import { cn } from "@/lib/cn";

interface FindingItem {
  sev: "P0" | "P1" | "P2";
  file: string;
  msg: string;
  req: string;
  latency: string;
}

const FINDINGS_DATA: FindingItem[] = [
  {
    sev: "P0",
    file: "agent-runner.ts",
    msg: "Tool retry skips approval check",
    req: "AGENT-12",
    latency: "42ms AST",
  },
  {
    sev: "P1",
    file: "checkout.amendment.ts",
    msg: "Tax exemption dropped on retry",
    req: "TAX-19",
    latency: "88ms AST",
  },
  {
    sev: "P2",
    file: "invoice-export.ts",
    msg: "Null customer breaks export",
    req: "INV-08",
    latency: "31ms AST",
  },
  {
    sev: "P1",
    file: "tool-scope.ts",
    msg: "Unsafe tool scope bypasses policy",
    req: "AGENT-08",
    latency: "65ms AST",
  },
  {
    sev: "P2",
    file: "prompt-engine.ts",
    msg: "Prompt version mismatch on rollback",
    req: "PROMPT-04",
    latency: "24ms AST",
  },
];

export function RequestFeed() {
  return (
    <div className="w-[300px] h-[200px] overflow-hidden select-none">
      <Marquee speed={22} className="h-full">
        {FINDINGS_DATA.map((item, idx) => (
          <div
            key={idx}
            className="w-full bg-[#efeeea] border border-[#d5d5cf] rounded-[10px] p-[10px_12px] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_24px_rgba(22,24,28,0.12)] flex flex-col gap-1.5"
          >
            {/* Row 1: Header */}
            <div className="flex items-center justify-between text-[11px] font-mono leading-none">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none font-mono",
                    item.sev === "P0" && "bg-[rgba(192,85,60,0.12)] border-[#c0553c] text-[#c0553c]",
                    item.sev === "P1" && "bg-[rgba(180,131,42,0.12)] border-[#b4832a] text-[#b4832a]",
                    item.sev === "P2" && "bg-[rgba(14,148,110,0.12)] border-[#0e946e] text-[#0a7c5c]"
                  )}
                >
                  {item.sev}
                </span>
                <span className="text-[#16181c] font-medium truncate max-w-[150px]">
                  {item.file}
                </span>
              </div>
              <span className="text-[10px] text-[#0a7c5c] font-mono font-medium">
                {item.req}
              </span>
            </div>

            {/* Row 2: Message */}
            <div className="font-sans text-[12px] text-[#33363c] leading-[1.3] truncate">
              {item.msg}
            </div>

            {/* Row 3: Meta */}
            <div className="flex items-center justify-between text-[10px] font-mono text-[#71747b] pt-0.5 border-t border-[#d5d5cf]/60">
              <span className="flex items-center gap-1">
                <GitPullRequest size={10} className="text-[#0e946e]" />
                <span>PR #4827</span>
              </span>
              <span>{item.latency}</span>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
