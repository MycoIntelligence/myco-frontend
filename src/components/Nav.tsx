"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Wordmark, Icon } from "./Icon";

const links = [
  { label: "Overview", href: "/#overview" },
  { label: "Playground", href: "/#playground" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Pricing", href: "/pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const container = dialog.current;
    const focusable = () => Array.from(container?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      } else if (event.key === "Tab") {
        const items = focusable();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  function closeMenu() {
    setOpen(false);
    trigger.current?.focus();
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-[72px] bg-[#101614]/95 text-white border-b border-white/10 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-8">
          <Link href="/" aria-label="Myco home" className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Wordmark theme="dark" /></Link>
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {links.map(link => <Link key={link.href} href={link.href} className="text-[14px] text-[#d2ddd7] hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{link.label}</Link>)}
          </nav>
          <Link href="/book-demo" className="hidden md:inline-flex items-center justify-center min-h-[44px] px-5 rounded-full bg-[#edf2ed] text-[#101614] text-[14px] font-semibold hover:bg-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Request a pilot</Link>
          <button ref={trigger} type="button" aria-label="Open menu" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)} className="md:hidden w-11 h-11 flex items-center justify-center rounded-full border border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Icon name="menu" size={21} /></button>
        </div>
      </header>
      {open && <div ref={dialog} id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation" className="fixed inset-0 z-[60] bg-[#101614] text-white p-6 flex flex-col overflow-y-auto md:hidden">
        <div className="flex items-center justify-between pb-6 border-b border-white/15"><Wordmark theme="dark" /><button type="button" onClick={closeMenu} aria-label="Close menu" className="w-11 h-11 flex items-center justify-center rounded-full border border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Icon name="x" size={21} /></button></div>
        <nav aria-label="Mobile navigation" className="flex flex-col py-8">{links.map(link => <Link key={link.href} href={link.href} onClick={closeMenu} className="py-4 text-[23px] border-b border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">{link.label}</Link>)}</nav>
        <Link href="/book-demo" onClick={closeMenu} className="mt-auto min-h-[50px] flex items-center justify-center rounded-full bg-[#edf2ed] text-[#101614] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Request a pilot</Link>
      </div>}
    </>
  );
}
