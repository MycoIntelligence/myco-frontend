import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export default function WhyPage() {
  return <PageShell eyebrow="OVERVIEW" title="Review changes with the surrounding context." lead="Myco helps engineers get features ready to ship while they’re still working on them.">
    <div className="max-w-[850px] space-y-10 text-lg leading-relaxed text-[#44595a]">
      <section><h2 className="text-2xl text-[#071a1b]">A pull request is only part of the story</h2><p className="mt-3">A change can look correct on its own while affecting behaviour elsewhere. Myco reviews proposed changes against accessible requirements and surrounding code, explaining what could break and why.</p></section>
      <section><h2 className="text-2xl text-[#071a1b]">Evidence for the engineer</h2><p className="mt-3">A useful finding identifies the behaviour at risk, relevant code, the reason for concern and what to investigate next. Missing or contradictory context should be visible. Engineers own fixes and release decisions.</p></section>
      <section><h2 className="text-2xl text-[#071a1b]">Where we’re going</h2><p className="mt-3">Myco is being built to carry feature intent and evidence from requirements through production. Contextual GitHub pull request review is the live foundation; availability of other capabilities depends on configuration or remains on the roadmap.</p></section>
      <Button variant="primary" href="/book-demo">Request a pilot</Button>
    </div>
  </PageShell>;
}
