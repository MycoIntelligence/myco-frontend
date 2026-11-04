# Pricing page design handoff

## Preview and files

Public review URL: https://myco-frontend.vercel.app/pricing/

- `pricing/index.html`: semantic page content, plan cards, three comparison tables and native FAQ disclosures.
- `static/css/pricing.css`: responsive layout and visual tokens.
- `static/js/pricing.js`: monthly/annual display updates, including the comparison summary.
- `static/js/pricing-config.js`: public CTA destinations.

Run `python3 serve.py` from the repository and open http://127.0.0.1:8766/pricing/.

## Visual direction

The headline states the offer: “Unlimited code review. Pay per developer.” Keep the content column at 960px on wide screens. Team uses a white surface; Enterprise uses deep green (#173B33) with high-contrast pale text. Shared card rows align content without fixed heading heights.

Capability panels have labelled, explanatory headers. Color is secondary to the heading and description:

| Family | Accent | Header surface | Purpose |
| --- | --- | --- | --- |
| Governance | #38634F | #EAF1E9 | Access, oversight and team standards |
| Deployment | #3D5D74 | #EAF0F5 | Infrastructure and internal connections |
| Support | #755F3F | #F3EFE6 | Community, email and enterprise support |

Below 720px, plans stack and each comparison row becomes a labelled Team/Enterprise record. Each family retains its own accessible table and caption. The pricing summary is hidden on mobile; plan-card pricing remains visible.

## Agreed commercial behavior

- Team: $20 per reviewed developer/month; $16/month billed as $192/developer/year.
- Monthly is the default. Prices in the card and comparison summary change together.
- Paid seats are admin-approved; viewers are free.
- Both plans include unlimited reviews and repositories, dashboard and analytics. Team includes community and email support, with no Slack channel. Enterprise includes priority Slack support and a dedicated CSM. Enterprise features and support are listed in full in the comparison.
- A 30-day trial requires no credit card. Reviews pause after the trial without subscription.
- Customers supply their own LLM API keys and pay usage separately, including during the trial.
- Keep the approved “Start 30-day free trial” label. Both current CTAs open the founder-provided Calendly URL. The nearby copy explains that the journey starts with an introduction.

## Implementation boundary

This is a marketing-page preview. The billing switch changes displayed pricing, not a checkout subscription. Signup, billing integration, carrying plan choice into booking, a shared pricing data source, homepage navigation integration and production web fonts remain separate engineering work. Do not change commercial terms while integrating the page. Geon currently relies on local availability, with Geist as fallback.

Changes are published only to grege-dev for review. Production promotion is a separate release step. Before release, verify the production route, metadata, booking destinations, billing switch, keyboard access, mobile overflow and font rendering.

## Design verification

- Reviewed desktop composition and responsive layouts at 320px, 390px and 768px with no horizontal page overflow.
- Checked monthly/annual updates in both the plan card and comparison summary, and opened the trial-expiry FAQ.
- Confirmed matching plan-button alignment at tablet width, unchanged booking destinations and no em dashes in the pricing page.
- Category heading text and Enterprise text contrast exceed 4.5:1 against their surfaces.
- JavaScript syntax and whitespace checks pass. Production integration checks above remain the engineer's release responsibility.
