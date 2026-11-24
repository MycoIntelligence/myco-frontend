import { PageShell } from "@/components/layout/PageShell";

const steps = [
  ["01", "Connect authorized context", "Discuss the repositories and requirements available for your evaluation. Access and supported sources depend on configuration."],
  ["02", "Review the change", "Myco evaluates a GitHub pull request against available intent and surrounding code, including authorized dependencies where configured."],
  ["03", "Investigate the finding", "Review the explanation, supporting context and any uncertainty. Your engineers decide what to investigate, fix and ship."],
];
export default function WorkflowPage() {
  return <PageShell eyebrow="WORKFLOW" title="Bring context to pull request review" lead="Start with one important workflow and agree what useful feedback looks like for your team.">
    <div className="grid gap-5 md:grid-cols-3">{steps.map(([n,title,body]) => <section key={n} className="rounded-[22px] border border-[#071a1b]/15 bg-white/35 p-7"><span className="font-mono text-sm text-[#526c69]">{n}</span><h2 className="mt-8 text-2xl text-[#071a1b]">{title}</h2><p className="mt-4 leading-relaxed text-[#44595a]">{body}</p></section>)}</div>
    <p className="mt-10 max-w-3xl leading-relaxed text-[#44595a]">Read access and permission to comment, run checks, modify code or affect a merge are separate decisions. Confirm supported actions and permissions for your configuration during evaluation.</p>
  </PageShell>;
}
