"use client";

import React from "react";
import { cn } from "@/lib/cn";

interface ChainRow {
  index: string;
  stage: string;
  result: string;
  status: "gray" | "amber" | "crit";
}

const ROWS: ChainRow[] = [
  {
    index: "01",
    stage: "Requirement AGENT-12",
    result: "Intent mapped",
    status: "gray",
  },
  {
    index: "02",
    stage: "AgentRunner AST call path",
    result: "3 modules",
    status: "gray",
  },
  {
    index: "03",
    stage: "Downstream toolPolicy trace",
    result: "Evaluated",
    status: "amber",
  },
  {
    index: "04",
    stage: "Retry bypasses approval",
    result: "P0 conflict",
    status: "crit",
  },
];

export function ChainTable({ active = true }: { active?: boolean }) {
  return (
    <div className="w-[360px] sm:w-[392px] bg-[rgba(239,238,234,0.85)] backdrop-blur-[14px] border border-[#d5d5cf] rounded-[10px] p-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_32px_rgba(22,24,28,0.18)] select-none">
      {/* Header */}
      <div className="flex items-center justify-between font-mono text-[11px] pb-2 border-b border-[rgba(22,24,28,0.1)]">
        <span className="font-semibold text-[#16181c]">trace id: 482-11</span>
        <span className="text-[#0a7c5c] font-medium">4 artifacts</span>
      </div>

      {/* Columns */}
      <div className="flex items-center justify-between font-mono text-[10px] text-[#71747b] py-2">
        <span>context node</span>
        <span>evaluation</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {ROWS.map((row, idx) => (
          <div
            key={row.index}
            style={{
              transitionDelay: `${idx * 140}ms`,
              opacity: active ? 1 : 0,
              transform: active ? "translateY(0)" : "translateY(6px)",
            }}
            className="flex items-center justify-between font-mono text-[11px] transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  row.status === "gray" && "bg-[#4fa36b]",
                  row.status === "amber" && "bg-[#c9983c]",
                  row.status === "crit" && "bg-[#c0553c]"
                )}
              />
              <span className="text-[#71747b]">{row.index}</span>
              <span
                className={cn(
                  "font-normal",
                  row.status === "crit" ? "text-[#c0553c] font-medium" : "text-[#16181c]"
                )}
              >
                {row.stage}
              </span>
            </div>
            <span
              className={cn(
                "font-medium",
                row.status === "gray" && "text-[#33363c]",
                row.status === "amber" && "text-[#c9983c]",
                row.status === "crit" && "text-[#c0553c]"
              )}
            >
              {row.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
