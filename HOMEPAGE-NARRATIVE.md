# Homepage narrative handoff

## Public positioning

Lead with the gap between faster implementation and reliable shipping. Myco is software-quality intelligence, with context-aware PR review as the current foundation and broader QA capabilities being developed.

Internal release names are not customer-facing language. Do not use them in website copy, outreach or pitch decks. Use plain capability descriptions and accurate status labels such as “Available today” and “Building next.”

## Page sequence

1. Shipping bottleneck: the hero and validation handoffs.
2. Available today: requirements-aware PR review and inspectable findings.
3. An illustrative agent retry finding, not a claim of a sourced customer incident.
4. How current PR review works.
5. Building next: scenario derivation, coverage evaluation, test execution and failure investigation. Clearly in development, not included in today's release.
6. Existing integrations and security sections.
7. Pilot request for current review and discussion of future quality workflows.

## Scope and integration

`static/js/product-narrative.js` applies the narrative after the existing static page composition. `static/css/product-narrative.css` preserves the established visual system and adds the responsive planned-capabilities section. The entry page loads both and updates title and description metadata. When migrating to a maintained source build, move this content into the source components and remove the composition layer together.

Existing KPI figures, integration availability, security promises and the existing social preview image are unchanged. Their evidence and deployment-specific accuracy need a separate review. Do not interpret this copy pass as verification of those claims.

No numerical performance promises were added. The implementation-complete-to-production metric is presented as a goal, with release quality and human control preserved.

## Verification

- Desktop visual review; 320px, 390px and 768px layouts checked for horizontal page overflow.
- One planned-capabilities section; no internal release names or em dashes in rendered homepage copy.
- Pilot request button opens the existing form; no test email submitted.
- Script syntax and whitespace checks pass.

Publish to grege-dev for preview. Production promotion remains separate.
