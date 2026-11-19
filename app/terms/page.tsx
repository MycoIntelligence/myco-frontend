import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export default function TermsPage() {
  return <PageShell eyebrow="TERMS" title="Request the applicable terms." lead="Evaluation and service terms should be agreed with the Myco team for your configuration.">
    <div className="max-w-[720px] space-y-6 text-lg leading-relaxed text-[#44595a]"><p>Contact us to discuss the terms, access permissions and scope that apply to your evaluation.</p><Button variant="primary" href="/book-demo">Contact the team</Button></div>
  </PageShell>;
}
