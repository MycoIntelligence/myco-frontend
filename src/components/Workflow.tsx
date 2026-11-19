"use client";

import React from "react";
import Image from "next/image";
import { FileText, Check, X, ShieldCheck } from "lucide-react";
import { Section } from "./Section";
import { Pill } from "./Pill";
import { BrandMark } from "./Icon";
import { siteContent } from "@/src/lib/content";

export function Workflow() {
  const { workflow } = siteContent;

  return (
    <Section id="workflow" data-theme="paper" className="relative select-none">
      {/* Anchor alias for #integrate */}
      <div id="integrate" className="absolute -top-24 left-0 pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <div className="max-w-[820px] mb-12 sm:mb-16">
        <Pill theme="light" className="mb-6">
          {workflow.eyebrow}
        </Pill>
        <h2 className="editorial-headline text-[clamp(32px,4.2vw,60px)] leading-[1.04] text-[var(--ink-on-light)] tracking-[-0.02em] mb-6">
          {workflow.titlePrimary}{" "}
          <span className="text-[var(--ink-muted-on-light)] block sm:inline font-light">
            {workflow.titleMuted}
          </span>
        </h2>
        <p className="editorial-body text-[clamp(15px,1.15vw,18px)] text-[var(--ink-muted-on-light)] leading-[1.6] max-w-[640px]">
          {workflow.body}
        </p>
      </div>

      {/* Integration Canvas */}
      <div className="relative w-full rounded-[28px] border border-[var(--line-light)] bg-[#eef3f0] p-6 sm:p-10 lg:p-14 overflow-hidden shadow-sm">
        {/* Subtle background grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_220px_1fr] items-center gap-8 lg:gap-10">
          {/* Left Stack: Ingest tools */}
          <div className="flex flex-col gap-4 w-full">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-muted-on-light)] mb-1">
              INGEST & CONTEXT
            </span>

            {/* Jira */}
            <div className="bg-white rounded-[16px] border border-[rgba(10,31,31,0.08)] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-[rgba(10,31,31,0.2)] transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-[#f2f7f5] border border-[rgba(10,31,31,0.06)] flex items-center justify-center shrink-0">
                  <Image src="/brands/jira.svg" alt="Jira logo" width={22} height={22} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-sans font-medium text-[15px] text-[var(--ink-on-light)] leading-tight">
                    Jira
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ink-muted-on-light)] mt-0.5 truncate">
                    Requirements &amp; tickets
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#546a67] bg-[#f0f4f3] border border-[#d2dedb] px-2.5 py-1 rounded-full shrink-0">
                Pilot
              </span>
            </div>

            {/* PRDs & documentation */}
            <div className="bg-white rounded-[16px] border border-[rgba(10,31,31,0.08)] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-[rgba(10,31,31,0.2)] transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-[#f2f7f5] border border-[rgba(10,31,31,0.06)] flex items-center justify-center shrink-0 text-[#27564d]">
                  <FileText size={20} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="font-sans font-medium text-[15px] text-[var(--ink-on-light)] leading-tight">
                    PRDs &amp; documentation
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ink-muted-on-light)] mt-0.5 truncate">
                    Intent &amp; acceptance criteria
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#546a67] bg-[#f0f4f3] border border-[#d2dedb] px-2.5 py-1 rounded-full shrink-0">
                Pilot
              </span>
            </div>
          </div>

          {/* Center Engine Node */}
          <div className="flex flex-col items-center justify-center text-center my-2 lg:my-0">
            <div className="relative flex items-center justify-center">
              {/* Pulse halo */}
              <div
                className="absolute inset-0 rounded-[24px] bg-[#9fd6cc] opacity-25 blur-xl pointer-events-none"
                aria-hidden="true"
              />
              <div className="relative w-[92px] h-[92px] rounded-[24px] bg-white border border-[#bed8d2] flex items-center justify-center shadow-lg">
                <BrandMark size={52} className="rounded-[12px]" />
              </div>
            </div>
            <span className="font-sans font-semibold text-[17px] text-[var(--ink-on-light)] mt-3">
              {workflow.tools.engine.name}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-muted-on-light)] mt-0.5">
              {workflow.tools.engine.sub}
            </span>
          </div>

          {/* Right Stack: Target workflow tools */}
          <div className="flex flex-col gap-4 w-full">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-muted-on-light)] mb-1">
              SURFACE IN WORKFLOW
            </span>

            {/* GitHub */}
            <div className="bg-white rounded-[16px] border border-[rgba(10,31,31,0.08)] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-[rgba(10,31,31,0.2)] transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-[#f2f7f5] border border-[rgba(10,31,31,0.06)] flex items-center justify-center shrink-0">
                  <Image src="/brands/github.svg" alt="GitHub logo" width={22} height={22} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-sans font-medium text-[15px] text-[var(--ink-on-light)] leading-tight">
                    GitHub
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ink-muted-on-light)] mt-0.5 truncate">
                    Pull request review
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#1e584a] bg-[#dcf1eb] border border-[#a8dfd1] px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1e8d75] animate-pulse" aria-hidden="true" />
                Live
              </span>
            </div>

            {/* VS Code */}
            <div className="bg-white rounded-[16px] border border-[rgba(10,31,31,0.08)] p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-[rgba(10,31,31,0.2)] transition-all">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-[#f2f7f5] border border-[rgba(10,31,31,0.06)] flex items-center justify-center shrink-0">
                  <Image src="/brands/vscode.svg" alt="VS Code logo" width={22} height={22} className="object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-sans font-medium text-[15px] text-[var(--ink-on-light)] leading-tight">
                    VS Code
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ink-muted-on-light)] mt-0.5 truncate">
                    Local development
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#546a67] bg-[#f0f4f3] border border-[#d2dedb] px-2.5 py-1 rounded-full shrink-0">
                Pilot
              </span>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--ink-muted-on-light)] text-center mt-10 pt-6 border-t border-[rgba(10,31,31,0.08)] max-w-[720px] mx-auto leading-relaxed">
          {workflow.caption}
        </p>
      </div>

      {/* Scoped Access / Permission Boundary Grid */}
      <div className="mt-16 sm:mt-20 pt-12 border-t border-[var(--line-light)]">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-muted-on-light)] block mb-2">
              SCOPED ACCESS MODEL
            </span>
            <h3 className="font-sans text-[22px] sm:text-[26px] font-medium text-[var(--ink-on-light)] tracking-[-0.02em]">
              Read-only by design. Zero repository writes.
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-[var(--ink-muted-on-light)]">
            <ShieldCheck size={16} className="text-[#1e8d75]" />
            <span>Strict Ephemeral Processing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflow.permissions.map((perm) => {
            const isAllow = perm.status === "ALLOW";
            return (
              <div
                key={perm.action}
                className="bg-white rounded-[16px] border border-[var(--line-light)] p-5 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-sans font-medium text-[14px] text-[var(--ink-on-light)] leading-snug">
                    {perm.action}
                  </div>
                  <div className="font-mono text-[11px] text-[var(--ink-muted-on-light)] mt-1 leading-normal">
                    {perm.detail}
                  </div>
                </div>

                <div
                  className={`font-mono text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 ${
                    isAllow
                      ? "text-[#185346] bg-[#dcf1eb] border border-[#a8dfd1]"
                      : "text-[#873426] bg-[#fcedea] border border-[#f3c2ba]"
                  }`}
                >
                  {isAllow ? <Check size={12} strokeWidth={2.5} /> : <X size={12} strokeWidth={2.5} />}
                  <span>{perm.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

