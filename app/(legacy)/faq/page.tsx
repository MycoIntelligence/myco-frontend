import { PageShell } from "@/components/layout/PageShell";

const questions = [
  ["What does Myco do today?", "Myco reviews GitHub pull requests against available requirements and surrounding code, explaining potential risks and why they matter."],
  ["What context can Myco use?", "Myco can follow dependencies within a repository and across authorized repositories where configured. Available sources, permissions and scope should be confirmed for each evaluation."],
  ["Does Myco run tests or diagnose failures?", "Coverage analysis, test suggestions, execution and failure investigation are part of the direction for the PR workflow. Availability should be confirmed for each capability and configuration."],
  ["Does Myco make release decisions?", "Engineers own fixes, sign-off and releases. Permissions for actions such as commenting, changing code or affecting a merge are separate from read access."],
  ["How do we evaluate Myco?", "Start with one important workflow, agree what useful feedback means, and compare results with your current process. Discuss pricing and evaluation terms with the team."],
  ["How is customer data handled?", "Data handling, model routing, deployment and security terms should be confirmed for your environment during evaluation."],
];
export default function FaqPage() {
  return <PageShell eyebrow="FAQ" title="Questions, answered" lead="The essentials about Myco’s pull request review and evaluation.">
    <div className="max-w-[860px] divide-y divide-[#071a1b]/15 border-y border-[#071a1b]/15">{questions.map(([q,a]) => <details key={q} className="group py-5"><summary className="cursor-pointer text-xl font-medium text-[#071a1b]">{q}</summary><p className="mt-4 max-w-[700px] leading-relaxed text-[#44595a]">{a}</p></details>)}</div>
  </PageShell>;
}
