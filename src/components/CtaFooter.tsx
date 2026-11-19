import Link from "next/link";

const columns = [
  { title: "Explore", links: [{ label: "Overview", href: "/#overview" }, { label: "Workflow", href: "/#workflow" }, { label: "Pricing", href: "/pricing" }] },
  { title: "Resources", links: [{ label: "Insights", href: "/blog" }, { label: "FAQ", href: "/faq" }, { label: "Request a pilot", href: "/book-demo" }] },
  { title: "Information", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms of use", href: "/terms" }] },
];

export function CtaFooter() {
  return (
    <footer id="contact" data-theme="dark" className="bg-[#101614] text-[#edf2ed] px-5 sm:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="py-20 sm:py-28 grid md:grid-cols-[1fr_auto] items-end gap-8 border-b border-white/15">
          <div><p className="text-[#a8c8b9] text-[12px] uppercase tracking-[0.12em] font-mono mb-5">Start with one workflow</p><h2 className="max-w-[14ch] text-[clamp(36px,5vw,64px)] leading-[1.06] tracking-[-0.035em] font-medium">See Myco in your workflow.</h2><p className="mt-5 max-w-[480px] text-[#c4d0c8] leading-relaxed">Explore how contextual pull request review can support your team.</p></div>
          <Link href="/book-demo" className="inline-flex items-center justify-center min-h-[48px] px-7 rounded-full bg-[#edf2ed] text-[#101614] text-[14px] font-semibold hover:bg-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Request a pilot</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-12 py-14">
          <div><p className="mt-5 max-w-[280px] text-[14px] leading-relaxed text-[#c4d0c8]">Helping engineers get features ready to ship while they’re still working on them.</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">{columns.map(column => <div key={column.title}><h3 className="text-[12px] uppercase tracking-[0.1em] text-[#a8c8b9] font-mono mb-5">{column.title}</h3><ul className="space-y-3">{column.links.map(link => <li key={link.href}><Link href={link.href} className="text-[14px] text-[#c4d0c8] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">{link.label}</Link></li>)}</ul></div>)}</div>
        </div>
        <div className="py-6 border-t border-white/15 text-[12px] text-[#b6c5bc]">© 2026 Myco Intelligence</div>
      </div>
    </footer>
  );
}
