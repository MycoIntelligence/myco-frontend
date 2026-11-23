import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export default function PrivacyPage() {
  return <PageShell eyebrow="PRIVACY" title="Discuss data handling with our team." lead="The handling of engineering context and customer data depends on the agreed configuration and terms.">
    <div className="max-w-[720px] space-y-6 text-lg leading-relaxed text-[#44595a]"><p>During an evaluation, discuss repository scope, connected sources, permissions, deployment, model routing and data handling with the Myco team.</p><p>Please request the applicable privacy and security documentation for your environment before connecting sensitive data.</p><Button variant="primary" href="/book-demo">Contact the team</Button></div>
  </PageShell>;
}
